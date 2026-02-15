# 🚀 Como Configurar a Contagem de Ações no Bot

Para que o Painel ADM mostre o número de ações realizadas, você precisa adicionar um pequeno código dentro da sua **extensão/bot** (o script que roda no TikTok).

---

## 1. Lógica de Incremento

Sempre que o bot realizar uma ação com sucesso (ex: seguir, curtir, comentar), você deve executar este código:

```javascript
// Função para incrementar ações no Firebase
async function registrarAcaoNoPainel(userId) {
    try {
        const userRef = firebase.database().ref('users/' + userId + '/actionsCount');
        
        // Incrementa o valor atual em 1 de forma atômica
        await userRef.transaction((currentCount) => {
            return (currentCount || 0) + 1;
        });
        
        console.log("✅ Ação registrada no Painel ADM!");
    } catch (error) {
        console.error("❌ Erro ao registrar ação:", error);
    }
}
```

---

## 2. Onde Inserir no seu Bot?

Você deve chamar a função `registrarAcaoNoPainel(userId)` logo após o bot completar uma tarefa. 

**Exemplo:**

```javascript
async function seguirUsuario() {
    // ... lógica para clicar no botão seguir ...
    
    if (sucessoAoSeguir) {
        const meuUserId = "ID_DO_USUARIO_LOGADO"; // O ID que o bot usa para se identificar
        await registrarAcaoNoPainel(meuUserId);
    }
}
```

---

## 3. Como o Painel Exibe os Dados?

O Painel ADM agora está configurado para:
1.  **Dashboard:** Somar as ações de **todos** os usuários e mostrar o total global.
2.  **Tabela de Usuários:** Mostrar individualmente quantas ações cada conta TikTok realizou.

---

## 4. Dica de Performance

Se o seu bot faz muitas ações por segundo, em vez de atualizar o Firebase em cada ação, você pode acumular localmente e enviar em lotes:

```javascript
let acoesAcumuladas = 0;

// Chame isso a cada ação
acoesAcumuladas++;

// A cada 10 ações ou a cada 1 minuto, envie para o Firebase
if (acoesAcumuladas >= 10) {
    enviarLoteParaFirebase(acoesAcumuladas);
    acoesAcumuladas = 0;
}
```

---

**Nota:** Certifique-se de que o `userId` usado no bot seja o mesmo que aparece no caminho `users/` do seu Firebase Realtime Database.
