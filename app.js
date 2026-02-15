// ==========================================
// RAMOS BOT - PAINEL ADM
// Firebase Integration (Sem Login)
// ==========================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCp19XIWkda9QxjobfolwJWhyjvow56NP4",
    authDomain: "injector-ef722.firebaseapp.com",
    databaseURL: "https://injector-ef722-default-rtdb.firebaseio.com",
    projectId: "injector-ef722",
    storageBucket: "injector-ef722.appspot.com",
    messagingSenderId: "870158581628",
    appId: "1:870158581628:web:d94becd53dc29493edeef9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'RAMOS-';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) key += '-';
    }
    return key;
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle'}"></i> ${message}`;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getKeyStatus(key) {
    if (key.revoked) return 'revoked';
    if (key.expiresAt && key.expiresAt < Date.now()) return 'expired';
    return 'active';
}

function daysUntilExpiry(expiresAt) {
    if (!expiresAt) return 9999;
    const diff = expiresAt - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Função para verificar se usuário está online
// Considera online se: isOnline === true E lastSeen nos últimos 2 minutos
function isUserOnline(user) {
    if (!user) return false;
    // Se o campo isOnline existe e é true, verificar se o lastSeen é recente (2 minutos)
    if (user.isOnline === true) {
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
        return user.lastSeen > twoMinutesAgo;
    }
    return false;
}

// Função para formatar tempo relativo
function formatRelativeTime(timestamp) {
    if (!timestamp) return '-';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h atrás`;
    return formatDate(timestamp);
}

// ==========================================
// DOM ELEMENTS
// ==========================================

const dashboardSection = document.getElementById('dashboardSection');
const keysSection = document.getElementById('keysSection');
const usersSection = document.getElementById('usersSection');
const logsSection = document.getElementById('logsSection');
const settingsSection = document.getElementById('settingsSection');

const navItems = document.querySelectorAll('.nav-item');

// Keys Modal
const keyModal = document.getElementById('keyModal');
const keyResultModal = document.getElementById('keyResultModal');
const generateKeyBtn = document.getElementById('generateKeyBtn');
const closeKeyModal = document.getElementById('closeKeyModal');
const closeKeyResultModal = document.getElementById('closeKeyResultModal');
const keyForm = document.getElementById('keyForm');
const copyKeyBtn = document.getElementById('copyKeyBtn');

// ==========================================
// INITIALIZATION - Carregar Dashboard ao iniciar
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadKeys();
    loadUsers();
    loadLogs();
    
    // Iniciar listeners em tempo real
    setupRealtimeListeners();
});

// ==========================================
// REALTIME LISTENERS
// ==========================================

function setupRealtimeListeners() {
    // Listener para usuários em tempo real
    database.ref('users').on('value', (snapshot) => {
        updateOnlineCount(snapshot.val());
        // Atualizar tabela de usuários se estiver visível
        if (usersSection.style.display === 'block') {
            renderUsersTable(snapshot.val());
        }
    });
    
    // Listener para keys em tempo real
    database.ref('keys').on('value', (snapshot) => {
        updateKeysStats(snapshot.val());
    });
}

function updateOnlineCount(users) {
    if (!users) {
        updateOnlineDisplay(0);
        updateTotalActions(0);
        return;
    }
    
    const usersArray = Object.values(users);
    
    // Atualizar online count
    const onlineCount = usersArray.filter(user => isUserOnline(user)).length;
    updateOnlineDisplay(onlineCount);

    // Atualizar total de ações
    const totalActions = usersArray.reduce((sum, user) => sum + (user.actionsCount || 0), 0);
    updateTotalActions(totalActions);
}

function updateTotalActions(count) {
    const totalActionsEl = document.getElementById('totalActions');
    if (totalActionsEl) {
        totalActionsEl.textContent = count.toLocaleString('pt-BR');
    }
}

function updateOnlineDisplay(count) {
    const onlineElement = document.getElementById('onlineUsers');
    if (onlineElement) {
        onlineElement.textContent = count;
        // Adicionar animação de pulse se houver usuários online
        if (count > 0) {
            onlineElement.classList.add('pulse-animation');
        } else {
            onlineElement.classList.remove('pulse-animation');
        }
    }
}

function updateKeysStats(keys) {
    if (!keys) return;
    
    const keysArray = Object.values(keys);
    let activeCount = 0;
    let expiredCount = 0;
    let expiringCount = 0;

    keysArray.forEach(key => {
        const status = getKeyStatus(key);
        if (status === 'active') {
            activeCount++;
            if (daysUntilExpiry(key.expiresAt) <= 7) {
                expiringCount++;
            }
        } else if (status === 'expired') {
            expiredCount++;
        }
    });

    const totalKeysEl = document.getElementById('totalKeys');
    const expiredKeysEl = document.getElementById('expiredKeys');
    const expiringKeysEl = document.getElementById('expiringKeys');
    
    if (totalKeysEl) totalKeysEl.textContent = activeCount;
    if (expiredKeysEl) expiredKeysEl.textContent = expiredCount;
    if (expiringKeysEl) expiringKeysEl.textContent = expiringCount;
}

// ==========================================
// NAVIGATION
// ==========================================

function hideAllSections() {
    dashboardSection.style.display = 'none';
    keysSection.style.display = 'none';
    usersSection.style.display = 'none';
    logsSection.style.display = 'none';
    settingsSection.style.display = 'none';
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        hideAllSections();

        switch (section) {
            case 'dashboard':
                dashboardSection.style.display = 'block';
                loadDashboard();
                break;
            case 'keys':
                keysSection.style.display = 'block';
                loadKeys();
                break;
            case 'users':
                usersSection.style.display = 'block';
                loadUsers();
                break;
            case 'logs':
                logsSection.style.display = 'block';
                loadLogs();
                break;
            case 'settings':
                settingsSection.style.display = 'block';
                break;
        }
    });
});

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
    // Set current date
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Load stats
    const keysSnapshot = await database.ref('keys').once('value');
    const keys = keysSnapshot.val() || {};
    const keysArray = Object.values(keys);

    let activeCount = 0;
    let expiredCount = 0;
    let expiringCount = 0;
    let totalDevices = 0;

    keysArray.forEach(key => {
        const status = getKeyStatus(key);
        if (status === 'active') {
            activeCount++;
            if (daysUntilExpiry(key.expiresAt) <= 7) {
                expiringCount++;
            }
        } else if (status === 'expired') {
            expiredCount++;
        }
        // Contar dispositivos
        if (key.devices && Array.isArray(key.devices)) {
            totalDevices += key.devices.length;
        }
    });

    document.getElementById('totalKeys').textContent = activeCount;
    document.getElementById('expiredKeys').textContent = expiredCount;
    document.getElementById('expiringKeys').textContent = expiringCount;

    // Load users count e online count
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    const usersArray = Object.values(users);
    
    document.getElementById('totalUsers').textContent = usersArray.length;
    
    // Calcular total de ações de todos os usuários
    const totalActions = usersArray.reduce((sum, user) => sum + (user.actionsCount || 0), 0);
    const totalActionsEl = document.getElementById('totalActions');
    if (totalActionsEl) totalActionsEl.textContent = totalActions.toLocaleString('pt-BR');

    // Contar usuários online
    const onlineCount = usersArray.filter(user => isUserOnline(user)).length;
    updateOnlineDisplay(onlineCount);

    // Load recent activity
    loadRecentActivity();
}

async function loadRecentActivity() {
    const logsSnapshot = await database.ref('logs').orderByChild('timestamp').limitToLast(10).once('value');
    const logs = logsSnapshot.val() || {};
    const logsArray = Object.entries(logs).map(([id, log]) => ({ id, ...log })).reverse();

    const activityList = document.getElementById('recentActivity');

    if (logsArray.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h4>Nenhuma atividade recente</h4>
                <p>As atividades aparecerão aqui</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = logsArray.map(log => `
        <div class="activity-item ${log.type}">
            <div class="activity-icon">
                <i class="fas fa-${log.type === 'success' ? 'check' : log.type === 'warning' ? 'exclamation' : log.type === 'error' ? 'times' : 'info'}"></i>
            </div>
            <div class="activity-info">
                <strong>${log.message}</strong>
                <span>${log.details || ''}</span>
            </div>
            <span class="activity-time">${formatDate(log.timestamp)}</span>
        </div>
    `).join('');
}

// ==========================================
// KEYS MANAGEMENT
// ==========================================

generateKeyBtn.addEventListener('click', () => {
    keyModal.style.display = 'flex';
});

closeKeyModal.addEventListener('click', () => {
    keyModal.style.display = 'none';
});

closeKeyResultModal.addEventListener('click', () => {
    keyResultModal.style.display = 'none';
});

keyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const duration = parseInt(document.getElementById('keyDuration').value);
    const deviceLimit = parseInt(document.getElementById('deviceLimit').value);

    const newKey = generateKey();
    const now = Date.now();
    const expiresAt = duration === 9999 ? null : now + (duration * 24 * 60 * 60 * 1000);

    const keyData = {
        key: newKey,
        clientName: clientName,
        createdAt: now,
        expiresAt: expiresAt,
        duration: duration,
        deviceLimit: deviceLimit,
        devices: [],
        revoked: false,
        usageCount: 0,
        machineBinding: true // Ativar vinculação de máquina por padrão
    };

    try {
        await database.ref('keys/' + newKey.replace(/-/g, '_')).set(keyData);
        
        keyModal.style.display = 'none';
        keyForm.reset();

        document.getElementById('generatedKey').value = newKey;
        keyResultModal.style.display = 'flex';

        addLog('success', 'Nova key gerada', `Cliente: ${clientName} | Duração: ${duration === 9999 ? 'Vitalício' : duration + ' dias'} | Limite: ${deviceLimit} dispositivo(s)`);
        showToast('Key gerada com sucesso!', 'success');
        loadKeys();
        loadDashboard();
    } catch (error) {
        showToast('Erro ao gerar key: ' + error.message, 'error');
    }
});

copyKeyBtn.addEventListener('click', () => {
    const keyInput = document.getElementById('generatedKey');
    keyInput.select();
    document.execCommand('copy');
    showToast('Key copiada para a área de transferência!', 'success');
});

async function loadKeys() {
    const keysSnapshot = await database.ref('keys').once('value');
    const keys = keysSnapshot.val() || {};
    const keysArray = Object.entries(keys).map(([id, key]) => ({ id, ...key }));

    const tableBody = document.getElementById('keysTableBody');

    if (keysArray.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-key"></i>
                        <h4>Nenhuma key cadastrada</h4>
                        <p>Clique em "Gerar Nova Key" para começar</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = keysArray.map(key => {
        const status = getKeyStatus(key);
        const statusLabel = status === 'active' ? 'Ativa' : status === 'expired' ? 'Expirada' : 'Revogada';
        const expiresText = key.expiresAt ? formatDateShort(key.expiresAt) : 'Vitalício';
        const devicesUsed = key.devices ? key.devices.length : 0;

        return `
            <tr>
                <td class="key-cell">${key.key}</td>
                <td>${key.clientName}</td>
                <td>
                    <span class="status-badge ${status}">
                        <span class="status-dot"></span>
                        ${statusLabel}
                    </span>
                </td>
                <td>${formatDateShort(key.createdAt)}</td>
                <td>${expiresText}</td>
                <td>
                    <span class="device-count ${devicesUsed >= key.deviceLimit ? 'limit-reached' : ''}" onclick="showDevices('${key.id}')" style="cursor: pointer;" title="Clique para ver dispositivos">
                        <i class="fas fa-desktop"></i> ${devicesUsed}/${key.deviceLimit}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn info" onclick="showDevices('${key.id}')" title="Ver Dispositivos">
                            <i class="fas fa-desktop"></i>
                        </button>
                        <button class="action-btn copy" onclick="copyKey('${key.key}')" title="Copiar Key">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn edit" onclick="extendKey('${key.id}')" title="Estender Prazo">
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="action-btn warning" onclick="resetDevices('${key.id}')" title="Resetar Dispositivos">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="action-btn delete" onclick="revokeKey('${key.id}')" title="Revogar Key">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function copyKey(key) {
    navigator.clipboard.writeText(key);
    showToast('Key copiada!', 'success');
}

async function revokeKey(keyId) {
    if (!confirm('Tem certeza que deseja revogar esta key?')) return;

    try {
        await database.ref('keys/' + keyId).update({ revoked: true });
        showToast('Key revogada com sucesso!', 'success');
        addLog('warning', 'Key revogada', `ID: ${keyId}`);
        loadKeys();
        loadDashboard();
    } catch (error) {
        showToast('Erro ao revogar key', 'error');
    }
}

async function extendKey(keyId) {
    const days = prompt('Quantos dias deseja adicionar?', '30');
    if (!days || isNaN(days)) return;

    try {
        const keySnapshot = await database.ref('keys/' + keyId).once('value');
        const key = keySnapshot.val();
        
        const baseDate = key.expiresAt || Date.now();
        const newExpiry = baseDate + (parseInt(days) * 24 * 60 * 60 * 1000);

        await database.ref('keys/' + keyId).update({ expiresAt: newExpiry });
        showToast(`Prazo estendido em ${days} dias!`, 'success');
        addLog('success', 'Prazo de key estendido', `ID: ${keyId} | +${days} dias`);
        loadKeys();
    } catch (error) {
        showToast('Erro ao estender prazo', 'error');
    }
}

// ==========================================
// DEVICE MANAGEMENT
// ==========================================

async function showDevices(keyId) {
    try {
        const keySnapshot = await database.ref('keys/' + keyId).once('value');
        const key = keySnapshot.val();
        
        if (!key) {
            showToast('Key não encontrada', 'error');
            return;
        }

        const devices = key.devices || [];
        
        let modalContent = `
            <div class="modal" id="devicesModal" style="display: flex;">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-desktop"></i> Dispositivos Vinculados - ${key.clientName}</h3>
                        <button class="close-modal" onclick="closeDevicesModal()">&times;</button>
                    </div>
                    <div class="devices-info">
                        <p><strong>Key:</strong> ${key.key}</p>
                        <p><strong>Limite:</strong> ${devices.length}/${key.deviceLimit} dispositivos</p>
                    </div>
        `;

        if (devices.length === 0) {
            modalContent += `
                    <div class="empty-state">
                        <i class="fas fa-desktop"></i>
                        <h4>Nenhum dispositivo vinculado</h4>
                        <p>Os dispositivos serão registrados quando a key for usada</p>
                    </div>
            `;
        } else {
            modalContent += `
                    <div class="devices-list">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Hash</th>
                                    <th>Plataforma</th>
                                    <th>Navegador</th>
                                    <th>Resolução</th>
                                    <th>Primeiro Acesso</th>
                                    <th>Último Acesso</th>
                                    <th>Acessos</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            devices.forEach((device, index) => {
                const details = device.details || {};
                const browserInfo = extractBrowserInfo(details.userAgent || details.ua || '');
                
                modalContent += `
                                <tr>
                                    <td title="${device.hash}">${device.hash ? device.hash.substring(0, 12) + '...' : '-'}</td>
                                    <td>${details.platform || details.plat || '-'}</td>
                                    <td>${browserInfo}</td>
                                    <td>${details.screenResolution || '-'}</td>
                                    <td>${formatDate(device.firstAccess)}</td>
                                    <td>${formatDate(device.lastAccess)}</td>
                                    <td>${device.accessCount || 0}</td>
                                    <td>
                                        <button class="action-btn delete" onclick="removeDevice('${keyId}', ${index})" title="Remover Dispositivo">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                `;
            });

            modalContent += `
                            </tbody>
                        </table>
                    </div>
            `;
        }

        modalContent += `
                    <div class="modal-footer" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="action-btn warning" onclick="resetDevices('${keyId}')" style="padding: 10px 20px;">
                            <i class="fas fa-sync"></i> Resetar Todos
                        </button>
                        <button class="main-action-btn" onclick="closeDevicesModal()" style="padding: 10px 20px;">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente se houver
        const existingModal = document.getElementById('devicesModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalContent);

    } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
        showToast('Erro ao carregar dispositivos', 'error');
    }
}

function extractBrowserInfo(userAgent) {
    if (!userAgent) return '-';
    
    if (userAgent.includes('Chrome')) {
        const match = userAgent.match(/Chrome\/(\d+)/);
        return `Chrome ${match ? match[1] : ''}`;
    } else if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/(\d+)/);
        return `Firefox ${match ? match[1] : ''}`;
    } else if (userAgent.includes('Safari')) {
        return 'Safari';
    } else if (userAgent.includes('Edge')) {
        return 'Edge';
    }
    return 'Outro';
}

function closeDevicesModal() {
    const modal = document.getElementById('devicesModal');
    if (modal) {
        modal.remove();
    }
}

async function removeDevice(keyId, deviceIndex) {
    if (!confirm('Tem certeza que deseja remover este dispositivo? O usuário precisará validar novamente.')) return;

    try {
        const keySnapshot = await database.ref('keys/' + keyId).once('value');
        const key = keySnapshot.val();
        
        if (!key || !key.devices) {
            showToast('Dispositivo não encontrado', 'error');
            return;
        }

        const devices = key.devices;
        const removedDevice = devices[deviceIndex];
        devices.splice(deviceIndex, 1);

        await database.ref('keys/' + keyId).update({ devices: devices });
        
        showToast('Dispositivo removido com sucesso!', 'success');
        addLog('warning', 'Dispositivo removido', `Key: ${key.key} | Hash: ${removedDevice.hash ? removedDevice.hash.substring(0, 16) : 'N/A'}...`);
        
        closeDevicesModal();
        showDevices(keyId);
        loadKeys();
    } catch (error) {
        console.error('Erro ao remover dispositivo:', error);
        showToast('Erro ao remover dispositivo', 'error');
    }
}

async function resetDevices(keyId) {
    if (!confirm('Tem certeza que deseja resetar TODOS os dispositivos desta key? Todos os usuários precisarão validar novamente.')) return;

    try {
        await database.ref('keys/' + keyId).update({ devices: [] });
        
        showToast('Dispositivos resetados com sucesso!', 'success');
        addLog('warning', 'Dispositivos resetados', `Key ID: ${keyId}`);
        
        closeDevicesModal();
        loadKeys();
        loadDashboard();
    } catch (error) {
        console.error('Erro ao resetar dispositivos:', error);
        showToast('Erro ao resetar dispositivos', 'error');
    }
}

// Search and Filter
document.getElementById('searchKeys').addEventListener('input', filterKeys);
document.getElementById('filterStatus').addEventListener('change', filterKeys);

async function filterKeys() {
    const searchTerm = document.getElementById('searchKeys').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;

    const keysSnapshot = await database.ref('keys').once('value');
    const keys = keysSnapshot.val() || {};
    let keysArray = Object.entries(keys).map(([id, key]) => ({ id, ...key }));

    // Apply filters
    keysArray = keysArray.filter(key => {
        const matchesSearch = key.key.toLowerCase().includes(searchTerm) || 
                             key.clientName.toLowerCase().includes(searchTerm);
        const status = getKeyStatus(key);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tableBody = document.getElementById('keysTableBody');

    if (keysArray.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h4>Nenhum resultado encontrado</h4>
                        <p>Tente ajustar os filtros</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = keysArray.map(key => {
        const status = getKeyStatus(key);
        const statusLabel = status === 'active' ? 'Ativa' : status === 'expired' ? 'Expirada' : 'Revogada';
        const expiresText = key.expiresAt ? formatDateShort(key.expiresAt) : 'Vitalício';
        const devicesUsed = key.devices ? key.devices.length : 0;

        return `
            <tr>
                <td class="key-cell">${key.key}</td>
                <td>${key.clientName}</td>
                <td>
                    <span class="status-badge ${status}">
                        <span class="status-dot"></span>
                        ${statusLabel}
                    </span>
                </td>
                <td>${formatDateShort(key.createdAt)}</td>
                <td>${expiresText}</td>
                <td>
                    <span class="device-count ${devicesUsed >= key.deviceLimit ? 'limit-reached' : ''}" onclick="showDevices('${key.id}')" style="cursor: pointer;" title="Clique para ver dispositivos">
                        <i class="fas fa-desktop"></i> ${devicesUsed}/${key.deviceLimit}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn info" onclick="showDevices('${key.id}')" title="Ver Dispositivos">
                            <i class="fas fa-desktop"></i>
                        </button>
                        <button class="action-btn copy" onclick="copyKey('${key.key}')" title="Copiar Key">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn edit" onclick="extendKey('${key.id}')" title="Estender Prazo">
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="action-btn warning" onclick="resetDevices('${key.id}')" title="Resetar Dispositivos">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="action-btn delete" onclick="revokeKey('${key.id}')" title="Revogar Key">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// USERS MANAGEMENT
// ==========================================

async function loadUsers() {
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    renderUsersTable(users);
}

function renderUsersTable(users) {
    const usersArray = Object.entries(users || {}).map(([id, user]) => ({ id, ...user }));
    
    // Ordenar por último acesso (mais recente primeiro)
    usersArray.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));

    const tableBody = document.getElementById('usersTableBody');

    if (usersArray.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h4>Nenhum usuário ativo</h4>
                        <p>Os usuários aparecerão aqui quando ativarem suas keys</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = usersArray.map(user => {
        const online = isUserOnline(user);
        const machineInfo = user.machineDetails || {};
        
        return `
            <tr class="${online ? 'user-online' : ''}">
                <td><strong>${user.accountName || '-'}</strong></td>
                <td class="key-cell">${user.keyUsed || '-'}</td>
                <td>${formatRelativeTime(user.lastSeen)}</td>
                <td>${user.actionsCount || 0}</td>
                <td>
                    <span class="machine-info" title="Hash: ${user.machineHash || 'N/A'}">
                        <i class="fas fa-desktop"></i> ${machineInfo.platform || '-'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${online ? 'active' : 'expired'}">
                        <span class="status-dot ${online ? 'online-pulse' : ''}"></span>
                        ${online ? 'Online' : 'Offline'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// LOGS
// ==========================================

async function addLog(type, message, details = '') {
    const logData = {
        type: type,
        message: message,
        details: details,
        timestamp: Date.now()
    };

    try {
        await database.ref('logs').push(logData);
    } catch (error) {
        console.error('Error adding log:', error);
    }
}

async function loadLogs() {
    const logsSnapshot = await database.ref('logs').orderByChild('timestamp').limitToLast(100).once('value');
    const logs = logsSnapshot.val() || {};
    const logsArray = Object.entries(logs).map(([id, log]) => ({ id, ...log })).reverse();

    const logsContainer = document.getElementById('logsContainer');

    if (logsArray.length === 0) {
        logsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h4>Nenhum log registrado</h4>
                <p>Os logs do sistema aparecerão aqui</p>
            </div>
        `;
        return;
    }

    logsContainer.innerHTML = logsArray.map(log => `
        <div class="log-entry ${log.type}">
            <span class="log-time">${formatDate(log.timestamp)}</span>
            <span class="log-message">
                <strong>${log.message}</strong>
                ${log.details ? ` - ${log.details}` : ''}
            </span>
        </div>
    `).join('');
}

document.getElementById('clearLogsBtn').addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs?')) return;

    try {
        await database.ref('logs').remove();
        showToast('Logs limpos com sucesso!', 'success');
        loadLogs();
    } catch (error) {
        showToast('Erro ao limpar logs', 'error');
    }
});

// ==========================================
// SETTINGS
// ==========================================

document.getElementById('exportDataBtn').addEventListener('click', async () => {
    try {
        const keysSnapshot = await database.ref('keys').once('value');
        const usersSnapshot = await database.ref('users').once('value');
        
        const exportData = {
            keys: keysSnapshot.val() || {},
            users: usersSnapshot.val() || {},
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ramos_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Dados exportados com sucesso!', 'success');
        addLog('info', 'Backup de dados exportado');
    } catch (error) {
        showToast('Erro ao exportar dados', 'error');
    }
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === keyModal) {
        keyModal.style.display = 'none';
    }
    if (e.target === keyResultModal) {
        keyResultModal.style.display = 'none';
    }
    if (e.target.id === 'devicesModal') {
        closeDevicesModal();
    }
});

// Make functions globally available
window.copyKey = copyKey;
window.revokeKey = revokeKey;
window.extendKey = extendKey;
window.showDevices = showDevices;
window.closeDevicesModal = closeDevicesModal;
window.removeDevice = removeDevice;
window.resetDevices = resetDevices;
