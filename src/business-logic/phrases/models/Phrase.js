class Phrase {
    constructor(title, text) {
        // generate a random id
        const randomId = () => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let id = "";
            for (let i = 0; i < 20; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        };
        this.id = randomId(); 
        this.title = title;
        this.text = text;
        this.symbol = null;
        this.frequency = 0;
        this.position = 0;
    }

    // Construct from a Firebase document
    static fromDocument(doc) {
        const data = doc.data();
        const phrase = new Phrase();
        phrase.id = doc.id;
        phrase.title = data.title;
        phrase.text = data.text;
        phrase.symbol = data.symbol;
        phrase.frequency = data.frequency;
        phrase.position = data.position;
        return phrase;
    }

    // Construct a json object for Firebase
    toDocument() {
        return {
            title: this.title,
            text: this.text,
            symbol: this.symbol,
            frequency: this.frequency,
            position: this.position
        };
    }
}

export default Phrase;