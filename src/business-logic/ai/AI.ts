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

        const json: { answer: string } = await response.json() as { answer: string };

        if (json.answer) {
            // Remove the quotes using regex
            return json.answer.replace(/['"]+/g, '');
        }

        return '';
    }

    async fillInGaps(text: string): Promise<string> {
        let command = "Fill in the gaps in the following text: \n\n\"\"\"\n" + text + "\n\"\"\"\n\n\"\"\"\n";
        command += "Don't return with quotes, just the text.\n";
        const response = await this.ask(command);
        if (response) {
            return response;
        }
        return '';
    }

    async fleshOut(text: string): Promise<string> {
        let command = "Flesh out the following text so that it makes sense: \n\n\"\"\"\n" + text + "\n\"\"\"\n\n\"\"\"\n";
        command += "Don't return with quotes, just the text.\n";
        const response = await this.ask(command);
        if (response) {
            return response;
        }
        return '';
    }
}

export default AI;
