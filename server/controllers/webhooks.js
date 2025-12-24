import { Webhook } from "svix";
import User from "../models/User.js";

const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        const evt = whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });

        const { data, type } = evt;

        switch (type) {
            case "user.created":
                await User.create({
                    _id: data.id,
                    email: data.email_addresses[0]?.email_address,
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                });
                break;

            case "user.updated":
                await User.findByIdAndUpdate(data.id, {
                    email: data.email_addresses[0]?.email_address,
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                });
                break;

            case "user.deleted":
                await User.findByIdAndDelete(data.id);
                break;
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("WEBHOOK FAILED ❌");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Webhook Error:", error);
        res.status(400).json({ success: false });
    }
};

export default clerkWebhooks;
