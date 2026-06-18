/**
 * Web Dashboard Client Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const categorySelect = document.getElementById("category-select");
    const groupSearch = document.getElementById("group-search");
    const groupsList = document.getElementById("groups-list");
    
    const emptyState = document.getElementById("empty-state");
    const chatContainer = document.getElementById("chat-container");
    
    const currentGroupTitle = document.getElementById("current-group-title");
    const currentGroupLink = document.getElementById("current-group-link-badge");
    const currentGroupMembers = document.getElementById("current-group-members");
    const currentGroupStatus = document.getElementById("current-group-status");
    
    const headerFavBtn = document.getElementById("header-fav-btn");
    const headerTrashBtn = document.getElementById("header-trash-btn");
    
    const metricSpam = document.getElementById("metric-spam");
    const spamProgress = document.getElementById("spam-progress");
    const metricActivity = document.getElementById("metric-activity");
    const metricMediaRatio = document.getElementById("metric-media-ratio");
    const metricLinkRatio = document.getElementById("metric-link-ratio");
    
    const chatMessageSearch = document.getElementById("chat-message-search");
    const chatResultsCount = document.getElementById("chat-results-count");
    const chatMessagesWrapper = document.getElementById("chat-messages-wrapper");

    // Modal & Settings elements
    const settingsBtn = document.getElementById("sidebar-settings-btn");
    const settingsModal = document.getElementById("settings-modal");
    const closeSettingsBtn = document.getElementById("close-settings-btn");
    const cancelSettingsBtn = document.getElementById("cancel-settings-btn");
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const apiBaseUrlInput = document.getElementById("api-base-url");
    const localTokenInput = document.getElementById("local-token");

    // Group Details Sidebar elements
    const headerInfoBtn = document.getElementById("header-info-btn");
    const groupDetailsSidebar = document.getElementById("group-details-sidebar");

    // Detailed metadata fields
    const groupDescription = document.getElementById("group-description");
    const detailUsername = document.getElementById("detail-username");
    const detailAdmins = document.getElementById("detail-admins");
    const detailBots = document.getElementById("detail-bots");
    const detailCreated = document.getElementById("detail-created");
    const detailLanguage = document.getElementById("detail-language");
    const detailBadgeContainer = document.getElementById("detail-badge-container");

    // Advanced Scores
    const scoreValDiscussion = document.getElementById("score-val-discussion");
    const scoreFillDiscussion = document.getElementById("score-fill-discussion");
    const scoreValAds = document.getElementById("score-val-ads");
    const scoreFillAds = document.getElementById("score-fill-ads");
    const scoreValCrypto = document.getElementById("score-val-crypto");
    const scoreFillCrypto = document.getElementById("score-fill-crypto");
    const scoreValGaming = document.getElementById("score-val-gaming");
    const scoreFillGaming = document.getElementById("score-fill-gaming");
    const scoreValShopping = document.getElementById("score-val-shopping");
    const scoreFillShopping = document.getElementById("score-fill-shopping");
    const scoreValNews = document.getElementById("score-val-news");
    const scoreFillNews = document.getElementById("score-fill-news");

    // Breakdown
    const breakdownTotalMessages = document.getElementById("breakdown-total-messages");
    const breakdownAvgLen = document.getElementById("breakdown-avg-len");
    const breakdownListContainer = document.getElementById("breakdown-list-container");

    // Configuration State
    let apiBaseUrl = localStorage.getItem("apiBaseUrl") || "";
    let bypassToken = localStorage.getItem("bypassToken") || "";

    // State
    let groups = [];
    let currentGroup = null;
    let chatMessages = [];

    // Unified API fetch helper with X-Telegram-Init-Data header injection
    async function fetchAPI(url, options = {}) {
        const fullUrl = apiBaseUrl ? (apiBaseUrl.replace(/\/$/, '') + url) : url;
        const initData = window.Telegram?.WebApp?.initData || bypassToken || "local_dev";
        options.headers = {
            ...(options.headers || {}),
            "X-Telegram-Init-Data": initData
        };
        const response = await fetch(fullUrl, options);
        if (response.status === 401 || response.status === 403) {
            const err = await response.json().catch(() => ({ detail: "Access Restricted" }));
            showAccessDenied(err);
            throw new Error("Unauthorized access");
        }
        return response;
    }

    function showAccessDenied(errData) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #0b0f19;
                color: #ffffff;
                font-family: 'Outfit', sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <i class="fa-solid fa-lock" style="font-size: 4rem; color: #f44336; margin-bottom: 20px;"></i>
                <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 10px; letter-spacing: 1px;">ACCESS RESTRICTED</h1>
                <p style="color: #94a3b8; max-width: 400px; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.6;">
                    ${errData.detail || 'This dashboard is restricted to whitelisted administrators.'}
                </p>
                <div style="font-size: 0.9rem; color: #64748b;">
                    If you believe this is an error, contact the bot owner.
                </div>
            </div>
        `;
    }

    // Initialize
    loadGroups();

    // Event Listeners
    categorySelect.addEventListener("change", loadGroups);
    groupSearch.addEventListener("input", renderGroupsList);
    
    chatMessageSearch.addEventListener("input", filterChatMessages);
    
    headerFavBtn.addEventListener("click", toggleFavorite);
    headerTrashBtn.addEventListener("click", toggleTrash);

    // Toggle Group Details Sidebar
    headerInfoBtn.addEventListener("click", () => {
        headerInfoBtn.classList.toggle("active");
        groupDetailsSidebar.classList.toggle("hidden");
    });

    // Settings Modal Handlers
    settingsBtn.addEventListener("click", () => {
        apiBaseUrlInput.value = apiBaseUrl;
        localTokenInput.value = bypassToken;
        settingsModal.classList.remove("hidden");
    });

    const closeModal = () => settingsModal.classList.add("hidden");
    closeSettingsBtn.addEventListener("click", closeModal);
    cancelSettingsBtn.addEventListener("click", closeModal);

    saveSettingsBtn.addEventListener("click", () => {
        apiBaseUrl = apiBaseUrlInput.value.trim();
        bypassToken = localTokenInput.value.trim();
        localStorage.setItem("apiBaseUrl", apiBaseUrl);
        localStorage.setItem("bypassToken", bypassToken);
        closeModal();
        loadGroups();
    });

    // Fetch and Load groups
    async function loadGroups() {
        showSidebarLoader();
        const category = categorySelect.value;
        const searchQuery = groupSearch.value;
        
        try {
            let url = `/api/groups?category=${encodeURIComponent(category)}`;
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            
            const response = await fetchAPI(url);
            groups = await response.json();
            
            renderGroupsList();
        } catch (error) {
            console.error("Failed to load groups:", error);
            groupsList.innerHTML = `<div class="empty-list">Failed to load groups. Click reload.</div>`;
        }
    }

    function showSidebarLoader() {
        groupsList.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <span>Loading groups...</span>
            </div>
        `;
    }

    // Render group cards in sidebar
    function renderGroupsList() {
        if (groups.length === 0) {
            groupsList.innerHTML = `<div class="empty-list">No groups found in this category.</div>`;
            return;
        }

        const category = categorySelect.value;
        const filterVal = groupSearch.value.toLowerCase();
        
        const filteredGroups = groups.filter(g => 
            g.title?.toLowerCase().includes(filterVal) || 
            g.link?.toLowerCase().includes(filterVal)
        );

        if (filteredGroups.length === 0) {
            groupsList.innerHTML = `<div class="empty-list">No matching groups found.</div>`;
            return;
        }

        groupsList.innerHTML = "";
        filteredGroups.forEach(g => {
            const card = document.createElement("div");
            card.className = "group-card";
            if (currentGroup && currentGroup.id === g.id) {
                card.classList.add("active");
            }

            // Determine active metric tag to display on card
            let metricHtml = "";
            if (category === "Top Groups" || category === "Largest Groups") {
                metricHtml = `<span class="group-card-badge active-metric"><i class="fa-solid fa-users"></i> ${formatNumber(g.members_count)}</span>`;
            } else if (category === "Most Active") {
                const freq = g.analysis_results?.message_analysis?.posting_frequency_per_day || 0;
                metricHtml = `<span class="group-card-badge active-metric"><i class="fa-solid fa-fire"></i> ${freq}/day</span>`;
            } else if (category === "Highest Media Ratio") {
                const ratio = g.analysis_results?.content_analysis?.media_ratio || 0;
                metricHtml = `<span class="group-card-badge active-metric"><i class="fa-solid fa-photo-film"></i> ${ratio.toFixed(2)}</span>`;
            } else if (category === "Highest Link Ratio") {
                const ratio = g.analysis_results?.content_analysis?.link_ratio || 0;
                metricHtml = `<span class="group-card-badge active-metric"><i class="fa-solid fa-link"></i> ${ratio.toFixed(2)}</span>`;
            } else if (category === "Lowest Spam Score") {
                const score = g.analysis_results?.content_analysis?.spam_score || 0;
                metricHtml = `<span class="group-card-badge active-metric"><i class="fa-solid fa-shield-halved"></i> ${score.toFixed(1)}%</span>`;
            } else {
                metricHtml = `<span class="group-card-badge"><i class="fa-solid fa-users"></i> ${formatNumber(g.members_count)}</span>`;
            }

            card.innerHTML = `
                <div class="group-card-title">${escapeHTML(g.title || 'Unnamed Group')}</div>
                <div class="group-card-subtitle">
                    <span>${escapeHTML(g.link_type)}</span>
                    ${metricHtml}
                </div>
            `;

            card.addEventListener("click", () => selectGroup(g));
            groupsList.appendChild(card);
        });
    }

    // Select Group & Open Chat
    async function selectGroup(group) {
        currentGroup = group;
        
        // Highlight active card
        const cards = groupsList.querySelectorAll(".group-card");
        cards.forEach((c, idx) => {
            const listGroup = groups[idx];
            if (listGroup && listGroup.id === group.id) {
                c.classList.add("active");
            } else {
                c.classList.remove("active");
            }
        });

        // Switch Workspace State
        emptyState.classList.add("hidden");
        chatContainer.classList.remove("hidden");

        // Set Metadata headers
        currentGroupTitle.textContent = group.title || "Unnamed Group";
        currentGroupLink.textContent = group.link;
        currentGroupLink.href = group.link;
        currentGroupLink.target = "_blank";
        currentGroupMembers.innerHTML = `<i class="fa-solid fa-users"></i> ${formatNumber(group.members_count)} members`;
        
        if (group.is_accessible) {
            currentGroupStatus.textContent = "Accessible";
            currentGroupStatus.className = "badge badge-status";
        } else {
            currentGroupStatus.textContent = group.error_reason || "Inaccessible";
            currentGroupStatus.className = "badge badge-status badge-status-error";
            currentGroupStatus.style.backgroundColor = "rgba(244, 67, 54, 0.15)";
            currentGroupStatus.style.color = "var(--accent-red)";
        }

        // Set Favorites & Trash buttons state
        updateFavBtnState(group.is_favorite);
        updateTrashBtnState(group.is_trash);

        // Render metrics
        const spamScore = group.analysis_results?.content_analysis?.spam_score || 0;
        metricSpam.textContent = `${spamScore.toFixed(1)}%`;
        spamProgress.style.width = `${spamScore}%`;
        
        if (spamScore < 20) {
            metricSpam.className = "metric-value text-safe";
            spamProgress.style.backgroundColor = "var(--accent-green)";
        } else if (spamScore < 50) {
            metricSpam.className = "metric-value text-warning";
            spamProgress.style.backgroundColor = "var(--accent-yellow)";
        } else {
            metricSpam.className = "metric-value text-danger";
            spamProgress.style.backgroundColor = "var(--accent-red)";
        }

        const frequency = group.analysis_results?.message_analysis?.posting_frequency_per_day || 0;
        metricActivity.textContent = `${frequency.toFixed(1)} msg/day`;

        const mediaRatio = group.analysis_results?.content_analysis?.media_ratio || 0;
        metricMediaRatio.textContent = mediaRatio.toFixed(2);

        const linkRatio = group.analysis_results?.content_analysis?.link_ratio || 0;
        metricLinkRatio.textContent = linkRatio.toFixed(2);

        // Populate Sidebar Group Details
        const meta = group.metadata || {};
        const analysis = group.analysis_results || {};
        const msgAnalysis = analysis.message_analysis || {};
        const contentAnalysis = analysis.content_analysis || {};

        // Description
        groupDescription.textContent = meta.description || "No description provided.";

        // Username, Admins, Bots, Created, Language
        detailUsername.textContent = meta.username ? `@${meta.username}` : "None";
        detailAdmins.textContent = meta.admin_count !== null && meta.admin_count !== undefined ? meta.admin_count : "Unknown";
        detailBots.textContent = meta.bot_count !== null && meta.bot_count !== undefined ? meta.bot_count : "Unknown";
        
        if (meta.creation_date) {
            const createdDate = new Date(meta.creation_date);
            detailCreated.textContent = createdDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            detailCreated.textContent = "Unknown";
        }

        detailLanguage.textContent = contentAnalysis.language_estimation || meta.language_estimation || "Unknown";

        // Badges / Flags
        detailBadgeContainer.innerHTML = "";
        
        if (meta.verified) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Verified</span>`;
        }
        if (meta.scam) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Scam</span>`;
        }
        if (meta.fake) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-danger"><i class="fa-solid fa-user-slash"></i> Fake</span>`;
        }
        if (group.join_approval_required || meta.join_approval_required) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-warning"><i class="fa-solid fa-lock-open"></i> Approval Req.</span>`;
        }
        if (meta.is_public) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-info"><i class="fa-solid fa-globe"></i> Public</span>`;
        } else {
            detailBadgeContainer.innerHTML += `<span class="badge badge-warning"><i class="fa-solid fa-shield-halved"></i> Private</span>`;
        }
        if (meta.slow_mode_enabled) {
            detailBadgeContainer.innerHTML += `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Slow: ${meta.slow_mode_seconds}s</span>`;
        }

        // Classifier Scores
        const setScore = (valEl, fillEl, scoreVal) => {
            const rounded = Math.round(scoreVal || 0);
            valEl.textContent = `${rounded}%`;
            fillEl.style.width = `${rounded}%`;
        };
        setScore(scoreValDiscussion, scoreFillDiscussion, contentAnalysis.discussion_score);
        setScore(scoreValAds, scoreFillAds, contentAnalysis.advertisement_score);
        setScore(scoreValCrypto, scoreFillCrypto, contentAnalysis.crypto_score);
        setScore(scoreValGaming, scoreFillGaming, contentAnalysis.gaming_score);
        setScore(scoreValShopping, scoreFillShopping, contentAnalysis.shopping_score);
        setScore(scoreValNews, scoreFillNews, contentAnalysis.news_score);

        // Message Breakdown Stats
        breakdownTotalMessages.textContent = msgAnalysis.messages_count || msgAnalysis.text_count || 0;
        breakdownAvgLen.textContent = Math.round(msgAnalysis.avg_message_length || 0);

        // Breakdown List items
        breakdownListContainer.innerHTML = "";
        const breakdownItems = [
            { name: "Texts", count: msgAnalysis.text_count, icon: "fa-message" },
            { name: "Photos", count: msgAnalysis.photo_count, icon: "fa-image" },
            { name: "Videos", count: msgAnalysis.video_count, icon: "fa-video" },
            { name: "GIFs", count: msgAnalysis.gif_count, icon: "fa-bolt" },
            { name: "Documents", count: msgAnalysis.document_count, icon: "fa-file" },
            { name: "Stickers", count: msgAnalysis.sticker_count, icon: "fa-face-smile" },
            { name: "Voice Notes", count: msgAnalysis.voice_count, icon: "fa-microphone" },
            { name: "Forwards", count: msgAnalysis.forward_count, icon: "fa-share" },
            { name: "Invite Links", count: msgAnalysis.tg_invite_link_count, icon: "fa-arrow-right-to-bracket" },
            { name: "External Links", count: msgAnalysis.external_link_count, icon: "fa-arrow-up-right-from-square" }
        ];

        breakdownItems.forEach(item => {
            if (item.count !== undefined && item.count !== null) {
                const row = document.createElement("div");
                row.className = "breakdown-item";
                row.innerHTML = `
                    <span class="breakdown-name"><i class="fa-solid ${item.icon}"></i> ${item.name}</span>
                    <span class="breakdown-value">${item.count}</span>
                `;
                breakdownListContainer.appendChild(row);
            }
        });

        // Clear chat search filter input
        chatMessageSearch.value = "";

        // Fetch Chat history
        fetchChatHistory(group.link);
    }

    async function fetchChatHistory(link) {
        chatMessagesWrapper.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <span>Fetching exported chat history...</span>
            </div>
        `;
        chatResultsCount.textContent = "Loading...";

        try {
            const res = await fetchAPI(`/api/chat?link=${encodeURIComponent(link)}`);
            const data = await res.json();
            
            chatMessages = data.messages || [];
            
            renderChatMessages(chatMessages);
        } catch (error) {
            console.error("Failed to load chat history:", error);
            chatMessagesWrapper.innerHTML = `
                <div class="empty-list">Failed to load message archives.</div>
            `;
            chatResultsCount.textContent = "Error";
        }
    }

    function renderChatMessages(messagesList) {
        if (messagesList.length === 0) {
            chatMessagesWrapper.innerHTML = `
                <div class="empty-list">No chat messages scanned or exported for this group.</div>
            `;
            chatResultsCount.textContent = "0 messages";
            return;
        }

        chatMessagesWrapper.innerHTML = "";
        chatResultsCount.textContent = `Showing all ${messagesList.length} messages`;

        let lastDateStr = "";

        // Messages are returned newest-first from Telethon, let's reverse to show chronologically
        const chronologicalMessages = [...messagesList].reverse();

        chronologicalMessages.forEach(msg => {
            // Check if we need to add a date divider
            if (msg.date) {
                const dateObj = new Date(msg.date);
                const dateStr = dateObj.toLocaleDateString(undefined, { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                });
                
                if (dateStr !== lastDateStr) {
                    const divider = document.createElement("div");
                    divider.className = "date-divider";
                    divider.textContent = dateStr;
                    chatMessagesWrapper.appendChild(divider);
                    lastDateStr = dateStr;
                }
            }

            const timeStr = msg.date ? new Date(msg.date).toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit'
            }) : "";

            const bubble = document.createElement("div");
            bubble.className = "message-bubble";
            bubble.dataset.msgId = msg.id;

            // Compute sender color class
            const colorClass = getSenderColorClass(msg.sender);

            // Format message body text (replacing urls with link tags)
            const formattedBody = formatMessageText(msg.text);

            bubble.innerHTML = `
                <span class="message-sender ${colorClass}">${escapeHTML(msg.sender)}</span>
                <div class="message-text">${formattedBody}</div>
                <div class="message-footer">
                    <span class="message-time">${timeStr}</span>
                </div>
            `;

            chatMessagesWrapper.appendChild(bubble);
        });

        // Auto Scroll to bottom
        setTimeout(() => {
            chatMessagesWrapper.scrollTop = chatMessagesWrapper.scrollHeight;
        }, 50);
    }

    // Filter messages inside the chat window
    function filterChatMessages() {
        const filterVal = chatMessageSearch.value.toLowerCase();
        const bubbles = chatMessagesWrapper.querySelectorAll(".message-bubble");
        let visibleCount = 0;

        // If filtering, we should temporarily hide date dividers as they don't hold text
        const dividers = chatMessagesWrapper.querySelectorAll(".date-divider");

        if (!filterVal) {
            // Show all bubbles and dividers
            bubbles.forEach(b => b.classList.remove("hidden"));
            dividers.forEach(d => d.classList.remove("hidden"));
            chatResultsCount.textContent = `Showing all ${chatMessages.length} messages`;
            return;
        }

        dividers.forEach(d => d.classList.add("hidden"));

        // Match messages
        bubbles.forEach(b => {
            const textContent = b.querySelector(".message-text").textContent.toLowerCase();
            const senderContent = b.querySelector(".message-sender").textContent.toLowerCase();
            
            if (textContent.includes(filterVal) || senderContent.includes(filterVal)) {
                b.classList.remove("hidden");
                visibleCount++;
            } else {
                b.classList.add("hidden");
            }
        });

        chatResultsCount.textContent = `Found ${visibleCount} of ${chatMessages.length} messages`;
    }

    // Favorites & Trash Interactions
    async function toggleFavorite() {
        if (!currentGroup) return;
        const previousState = currentGroup.is_favorite;
        const newState = !previousState;
        
        // Optimistic UI update
        currentGroup.is_favorite = newState;
        updateFavBtnState(newState);

        try {
            const res = await fetchAPI("/api/favorite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ link: currentGroup.link })
            });
            const data = await res.json();
            currentGroup.is_favorite = data.is_favorite;
            updateFavBtnState(data.is_favorite);

            // Reload sidebar list if we are in Favorites category
            if (categorySelect.value === "Favorites") {
                loadGroups();
            }
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            currentGroup.is_favorite = previousState;
            updateFavBtnState(previousState);
        }
    }

    async function toggleTrash() {
        if (!currentGroup) return;
        const previousState = currentGroup.is_trash;
        const newState = !previousState;
        
        // Optimistic UI update
        currentGroup.is_trash = newState;
        updateTrashBtnState(newState);

        try {
            const res = await fetchAPI("/api/trash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ link: currentGroup.link })
            });
            const data = await res.json();
            currentGroup.is_trash = data.is_trash;
            updateTrashBtnState(data.is_trash);

            // Hide chat window if moved to trash and we are not in Trash view
            if (categorySelect.value !== "Trash") {
                chatContainer.classList.add("hidden");
                emptyState.classList.remove("hidden");
                currentGroup = null;
            }

            // Reload sidebar list
            loadGroups();
        } catch (error) {
            console.error("Failed to toggle trash:", error);
            currentGroup.is_trash = previousState;
            updateTrashBtnState(previousState);
        }
    }

    function updateFavBtnState(isFav) {
        if (isFav) {
            headerFavBtn.classList.add("active");
            headerFavBtn.querySelector("i").className = "fa-solid fa-star";
        } else {
            headerFavBtn.classList.remove("active");
            headerFavBtn.querySelector("i").className = "fa-regular fa-star";
        }
    }

    function updateTrashBtnState(isTrash) {
        if (isTrash) {
            headerTrashBtn.classList.add("active");
            headerTrashBtn.querySelector("i").className = "fa-solid fa-trash-can";
        } else {
            headerTrashBtn.classList.remove("active");
            headerTrashBtn.querySelector("i").className = "fa-regular fa-trash-can";
        }
    }

    // Helper functions
    function formatNumber(num) {
        if (num === undefined || num === null) return "0";
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "k";
        }
        return num.toString();
    }

    function getSenderColorClass(sender) {
        if (!sender || sender === "Unknown") return "sender-c1";
        // Simple hash code
        let hash = 0;
        for (let i = 0; i < sender.length; i++) {
            hash = sender.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % 10) + 1; // c1 to c10
        return `sender-c${index}`;
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatMessageText(text) {
        if (!text) return "";
        // Escape standard HTML tags
        let escaped = escapeHTML(text);

        // Unified non-overlapping regex for HTTP/S urls, raw t.me links, and @mentions
        const pattern = /(https?:\/\/[^\s<]+)|(\bt\.me\/[A-Za-z0-9_+\-]+)|((?<!\w)@[A-Za-z0-9_]{4,32}\b)/ig;

        return escaped.replace(pattern, (match, p1, p2, p3) => {
            if (p1) {
                // HTTP/HTTPS link
                return `<a href="${p1}" target="_blank" rel="noopener noreferrer">${p1}</a>`;
            } else if (p2) {
                // Raw t.me link
                return `<a href="https://${p2}" target="_blank" rel="noopener noreferrer">${p2}</a>`;
            } else if (p3) {
                // Username mention
                const username = p3.substring(1);
                return `<a href="https://t.me/${username}" target="_blank" rel="noopener noreferrer">${p3}</a>`;
            }
            return match;
        });
    }
});
