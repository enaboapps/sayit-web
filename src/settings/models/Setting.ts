// This is a model of a setting:
//     {
//         id: "setting id",
//         name: "setting name",
//         value: "setting value"
//     }

class Setting {
    id: string;
    name: string;
    value: string;

    constructor() {
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
        this.name = "";
        this.value = "";
    }

    static fromDocument(doc: { data: () => any; id: string; }) {
        const data = doc.data();
        const setting = new Setting();
        setting.id = doc.id;
        setting.name = data.name;
        setting.value = data.value;
        return setting;
    }

    toDocument() {
        return {
            id: this.id,
            name: this.name,
            value: this.value,
        };
    }
}

export default Setting;