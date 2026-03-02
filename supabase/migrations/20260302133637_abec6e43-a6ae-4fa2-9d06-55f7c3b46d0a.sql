-- Create a public storage bucket for scan documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-documents', 'scan-documents', true);

-- Allow anyone to upload files to scan-documents bucket
CREATE POLICY "Anyone can upload scan documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scan-documents');

-- Allow anyone to read scan documents
CREATE POLICY "Anyone can read scan documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'scan-documents');

-- Allow anyone to delete their uploaded scan documents
CREATE POLICY "Anyone can delete scan documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'scan-documents');