// ========================================
// INTEGRAÇÃO WHATSAPP + CHATBASE
// Prefeitura Municipal de Curitiba
// ========================================

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// ========================================
// CONFIGURAÇÕES - SUAS CREDENCIAIS
// ========================================

const CHATBASE_API_KEY = '14cf50cb-b781-444b-929a-b572291dbea7';
const CHATBOT_ID = 'fLa3ayIVyOPPRMKcvnwRq';
const CHATBASE_API_URL = 'https://www.chatbase.co/api/v1/chat';

// Porta do servidor
const PORT = process.env.PORT || 3000;

// ========================================
// FUNÇÃO: ENVIAR MENSAGEM PARA CHATBASE
// ========================================

async function enviarParaChatbase(mensagemUsuario, conversationId) {
  try {
    const response = await axios.post(
      CHATBASE_API_URL,
      {
        messages: [
          {
            content: mensagemUsuario,
            role: 'user'
          }
        ],
        chatbotId: CHATBOT_ID,
        conversationId: conversationId,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${CHATBASE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.text;
  } catch (error) {
    console.error('Erro ao consultar Chatbase:', error.response?.data || error.message);
    return 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.';
  }
}

// ========================================
// WEBHOOK: RECEBER MENSAGENS DO WHATSAPP
// ========================================

app.post('/webhook', async (req, res) => {
  try {
    const dados = req.body;

    // Verificar se é uma mensagem de texto
    if (dados.message && dados.message.conversation) {
      const mensagemUsuario = dados.message.conversation;
      const numeroRemetente = dados.key.remoteJid;
      
      console.log(`📱 Mensagem recebida de ${numeroRemetente}: ${mensagemUsuario}`);

      // Enviar para o Chatbase
      const respostaChatbot = await enviarParaChatbase(mensagemUsuario, numeroRemetente);

      console.log(`🤖 Resposta do chatbot: ${respostaChatbot}`);

      // Enviar resposta de volta para o WhatsApp
      await axios.post(
        `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.INSTANCE_NAME}`,
        {
          number: numeroRemetente,
          text: respostaChatbot
        },
        {
          headers: {
            'apikey': process.env.EVOLUTION_API_KEY
          }
        }
      );

      console.log('✅ Resposta enviada com sucesso!');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erro no webhook:', error.message);
    res.status(500).send('Erro interno');
  }
});

// ========================================
// ROTA DE TESTE
// ========================================

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Chatbot DUDA - Prefeitura de Curitiba</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #0066cc; }
          .status {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4caf50;
          }
          .info {
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Chatbot DUDA</h1>
          <h2>Prefeitura Municipal de Curitiba</h2>
          
          <div class="status">
            <h3>✅ Sistema Online</h3>
            <p>O servidor está funcionando corretamente!</p>
          </div>
          
          <div class="info">
            <h3>📊 Informações do Sistema:</h3>
            <p><strong>Chatbot ID:</strong> ${CHATBOT_ID}</p>
            <p><strong>Status API:</strong> Conectado</p>
            <p><strong>Webhook:</strong> /webhook</p>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            Desenvolvido para a Secretaria Municipal de Gestão de Pessoal
          </p>
        </div>
      </body>
    </html>
  `);
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 SERVIDOR INICIADO COM SUCESSO!
  ========================================
  
  📡 Porta: ${PORT}
  🤖 Chatbot: DUDA
  🏛️  Instituição: Prefeitura de Curitiba
  
  ✅ Pronto para receber mensagens!
  ========================================
  `);
});
