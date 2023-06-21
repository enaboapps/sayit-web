class AI {
    async ask(question: string): Promise<string> {
        const response = await fetch('https://us-central1-sayit-b44d5.cloudfunctions.net/askOpenAI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        // Check if the request was successful
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const json: { choices?: {message: string}[] } = await response.json() as { choices?: {message: string}[] };
        
        // Check if choices exists in the response and has at least one element
        if (json.choices && json.choices.length > 0) {
            return json.choices[0].message;
        }
        
        return '';
    }
}

export default AI;
