import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pibltfngauqztjsfqzcv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYmx0Zm5nYXVxenRqc2ZxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODE0NjcsImV4cCI6MjA2Mzg1NzQ2N30.8Kug8-huMJnA0aB8x2oyrSl6B3Nv257PrHFtaHTC9-s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
