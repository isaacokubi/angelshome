// test.js
import bcrypt from "bcrypt";

const password = "123456";

const hash = await bcrypt.hash(password, 10);

console.log("Hash:", hash);

const match = await bcrypt.compare(password, hash);

console.log("Match:", match);