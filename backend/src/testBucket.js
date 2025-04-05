import { supabase } from '../lib/supabase.js';

const testBucketAccess = async () => {
    try {
        // Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
            return;
        }

        const chatFilesBucket = buckets.find(bucket => bucket.name === 'chat-files');

        if (!chatFilesBucket) {
            console.error('chat-files bucket not found!');
            return;
        }

        console.log('chat-files bucket exists:', chatFilesBucket);

        // Try to upload a test file
        const testBuffer = Buffer.from('Test file content');
        const testPath = 'test/test-file.txt';

        const { error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(testPath, testBuffer, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading test file:', uploadError);
            return;
        }

        console.log('Test file uploaded successfully');

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(testPath);

        console.log('Test file public URL:', urlData.publicUrl);

        // Clean up
        const { error: deleteError } = await supabase.storage
            .from('chat-files')
            .remove([testPath]);

        if (deleteError) {
            console.error('Error deleting test file:', deleteError);
            return;
        }

        console.log('Test file deleted successfully');
        console.log('Bucket test completed successfully!');
    } catch (error) {
        console.error('Unexpected error testing bucket:', error);
    }
};

testBucketAccess();