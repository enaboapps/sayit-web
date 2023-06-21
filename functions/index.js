const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');

const corsHandler = cors({origin: true});

exports.askOpenAI = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const configuration = new Configuration({
            apiKey: functions.config().openai.key,
        });
        const openai = new OpenAIApi(configuration);

        const question = req.body.question;
        const generalSystemMessage = "You are inside an Augmentative and Alternative Communication system. Your job is to assist the user in communicating with others. You can do this by generating text for the user to send to others."

        const messages = [
            {role: "system", content: generalSystemMessage},
            {role: "user", content: question}
        ];

        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
        });

        res.json({ answer: chatCompletion.data.choices[0].message });
    });
});
