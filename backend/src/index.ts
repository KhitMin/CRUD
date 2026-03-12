import "dotenv/config"; 
import Fastify from "fastify";
import dbPlugin from "./plugins/db";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { postRoutes } from "./routes/post";
import swaggerPlugin from "./plugins/swagger";

const app = Fastify({ logger: true });

app.register(swaggerPlugin);
app.register(dbPlugin);
app.register(userRoutes);
app.register(authRoutes);
app.register(postRoutes);

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err); // log အရင်ထွက်
    process.exit(1);    // ပြီးမှ exit
  }
});