import { CompanyProfile } from "./CompanyProfile";

export interface DialogueTurn {
    user_handle: string; // "userA" or "userB"
    comment_text: string;
}
