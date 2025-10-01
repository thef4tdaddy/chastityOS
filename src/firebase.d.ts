import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth";

declare module "../../firebase" {
  export const db: Firestore;
  export const auth: Auth;
}

declare module "./firebase" {
  export const db: Firestore;
  export const auth: Auth;
}
