import { UserMessage } from "../../../generated/UserMessage"

export class MessageHandler<T extends UserMessage> {
    
    type;
    role;
    requiresAuthentication = true;

    constructor (type, role, requiresAuthentication) {
        this.type = type;

        if (role != null && !Array.isArray(role)) {
            throw new Error(`Parameter role must be an array of roles (roles are numbers: e.g. [1,2]). It was: ${role}`);
        }

        this.role = role;

        if (typeof requiresAuthentication === "boolean") {
            this.requiresAuthentication = requiresAuthentication;
        }
    }

    action (ws, message: T, player, phase) {
        throw new Error('Method action must always be overwritten');
    }
}