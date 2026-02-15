/**
 * 🚀 SISTEMA DE AUTO-UPDATE REMOTO (RAMOS BOT)
 * Este script permite que o bot carregue a lógica mais recente diretamente do seu GitHub
 * sem que o usuário precise reinstalar a extensão.
 */

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/Carlos20473736/ramos-bot/main/bot_logic.js";
const VERSION_URL = "https://raw.githubusercontent.com/Carlos20473736/ramos-bot/main/version.json";

async function checkAndUpdate() {
    try {
        // 1. Verificar versão atual
        const response = await fetch(VERSION_URL);
        const remoteData = await response.json();
        const currentVersion = localStorage.getItem('bot_version') || "1.0.0";

        console.log(`🔍 Verificando atualização... Local: ${currentVersion} | Remota: ${remoteData.version}`);

        if (remoteData.version !== currentVersion) {
            console.log("✨ Nova atualização encontrada! Baixando...");
            
            // 2. Baixar o novo código
            const codeResponse = await fetch(GITHUB_RAW_URL);
            const newCode = await codeResponse.text();

            // 3. Salvar localmente para persistência
            localStorage.setItem('bot_logic', newCode);
            localStorage.setItem('bot_version', remoteData.version);

            console.log("✅ Bot atualizado com sucesso! Reiniciando lógica...");
            executeBotLogic(newCode);
        } else {
            console.log("✅ Bot já está na versão mais recente.");
            const savedCode = localStorage.getItem('bot_logic');
            if (savedCode) executeBotLogic(savedCode);
        }
    } catch (error) {
        console.error("❌ Erro no Auto-Update:", error);
        // Fallback: carregar código salvo anteriormente se houver erro
        const fallbackCode = localStorage.getItem('bot_logic');
        if (fallbackCode) executeBotLogic(fallbackCode);
    }
}

function executeBotLogic(code) {
    try {
        // Executa o código dinamicamente
        // Nota: Em extensões Chrome, pode ser necessário usar 'scripting.executeScript' 
        // ou garantir que as permissões de CSP permitam eval/Function se for um content script.
        const runLogic = new Function(code);
        runLogic();
    } catch (e) {
        console.error("❌ Erro ao executar lógica do bot:", e);
    }
}

// Iniciar verificação ao abrir o bot
checkAndUpdate();
