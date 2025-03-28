import axios from "axios";

export async function prueba() {
    const response = await axios.get("http://localhost:5000/api/data")
    console.log(response)
}