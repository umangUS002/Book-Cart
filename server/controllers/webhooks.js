import { Webhook } from "svix";
import User from "../models/User.js";

// API Controller Function to Manage Clerk User with Database
const clerkWebhooks = async (req, res) => {
    try {

        // Create a svix instance with clerk webhook secret
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);


        // Verifying Headers 
        const evt = whook.verify(req.body, {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });

        const { data, type } = evt;


        // Switch case for different events
        switch (type) {
            case 'user.created': {

                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address,
                    name: data.first_name + " " + data.last_name,
                }
                await User.create(userData)
                res.json({})
                break;
            }

            case 'user.updated': {

                const userData = {
                    email: data.email_addresses[0].email_address,
                    name: data.first_name + " " + data.last_name,
                }
                await User.findByIdAndUpdate(data.id, userData)
                res.json({})
                break;
            }

            case 'user.deleted': {
                await User.findByIdAndDelete(data.id);
                res.json({})
                break;
            }

            default:
                break;

        }

    } catch (error) {
        console.log(error.message);
        res.json({ sucess: false, message: 'Webhooks Error' })

    }
}

export default clerkWebhooks