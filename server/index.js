import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ status: "very nice" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
