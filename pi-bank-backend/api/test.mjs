import { response } from "sdk/http";

const message = "Hello World!";
response.setContentLength(message.length);
response.println(message);
