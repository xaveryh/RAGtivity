const password = process.env.DB_PASSWORD

const uri = `mongodb+srv://ragtivity:${password}@cluster0.8ssge3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

export default uri