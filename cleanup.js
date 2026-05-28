import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// IMPORTANT: Create a .env file in your project root and add these variables
// You can find these in your Supabase project settings
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URL and Service Role Key are required. Please create a .env file."
  );
}

// The service_role key has admin privileges and is required to delete users.
// NEVER expose this key in your frontend application.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUsers() {
  console.log("Fetching all users...");
  const {
    data: { users },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error("Error fetching users:", listError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No users to delete.");
    return;
  }

  console.log(`Found ${users.length} users. Deleting them now...`);
  for (const user of users) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );
    if (deleteError) {
      console.error(`Failed to delete user ${user.id}:`, deleteError.message);
    } else {
      console.log(`Successfully deleted user ${user.id}`);
    }
  }
  console.log("All users have been processed.");
}

async function deleteAllBlogs() {
  console.log('Deleting all records from the "blogs" table...');
  // Make sure your table is named 'blogs'. If not, change it here.
  const { error } = await supabaseAdmin.from("blogs").delete().gt("id", 0); // Deletes all rows

  if (error) {
    console.error("Error deleting blogs:", error.message);
  } else {
    console.log("Successfully deleted all blogs.");
  }
}

async function deleteAllNotes() {
  console.log('Deleting all records from the "notes" table...');
  // Make sure your table is named 'notes'. If not, change it here.
  const { error } = await supabaseAdmin.from("notes").delete().gt("id", 0); // Deletes all rows

  if (error) {
    console.error("Error deleting notes:", error.message);
  } else {
    console.log("Successfully deleted all notes.");
  }
}

async function deleteAllChannels() {
  console.log('Deleting all records from the "channels" table...');
  // Make sure your table is named 'channels'. If not, change it here.
  const { error } = await supabaseAdmin.from("channels").delete().gt("id", 0); // Deletes all rows

  if (error) {
    console.error("Error deleting channels:", error.message);
  } else {
    console.log("Successfully deleted all channels.");
  }
}

async function main() {
  await Promise.all([
    deleteAllBlogs(),
    deleteAllNotes(),
    deleteAllChannels(),
  ]);
  await deleteAllUsers();
  console.log("Cleanup finished.");
}

main().catch(console.error);