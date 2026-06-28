require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createBucket() {
  console.log("Checking if bucket 'ticket-attachments' exists...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }
  
  const exists = buckets.some(b => b.name === 'ticket-attachments');
  if (exists) {
    console.log("Bucket already exists. Updating to public...");
    await supabase.storage.updateBucket('ticket-attachments', {
      public: true,
      allowedMimeTypes: null,
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    console.log("Bucket updated to public.");
  } else {
    console.log("Bucket does not exist. Creating...");
    const { data, error } = await supabase.storage.createBucket('ticket-attachments', {
      public: true,
      allowedMimeTypes: null,
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log("Bucket 'ticket-attachments' created successfully.");
    }
  }
}

createBucket();
