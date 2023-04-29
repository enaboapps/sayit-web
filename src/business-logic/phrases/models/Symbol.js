class Symbol {
    constructor(id, hideText = false, image = null) {
        this.id = id;
        this.hideText = hideText;
        this.image = image;
    }

    load() {
        // TODO: Load the symbol from the database
    }
}

export default Symbol;