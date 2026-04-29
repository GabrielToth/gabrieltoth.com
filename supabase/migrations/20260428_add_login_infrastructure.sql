-- Add login infrastructure tables for secure login implementation
-- This migration adds tables for session management, rate limiting, and CSRF protection

-- Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" character varying(255) NOT NULL,
    "ip_address" character varying(45),
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "success" boolean DEFAULT false,
    "reason" text
);

ALTER TABLE "public"."login_attempts" OWNER TO "postgres";

CREATE INDEX "idx_login_attempts_email_ip_time" ON "public"."login_attempts" USING "btree" ("email", "ip_address", "attempted_at" DESC);
CREATE INDEX "idx_login_attempts_user_id" ON "public"."login_attempts" USING "btree" ("user_id");

ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "token_hash" character varying(255),
    "ip_address" character varying(45),
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

ALTER TABLE "public"."sessions" OWNER TO "postgres";

CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");
CREATE INDEX "idx_sessions_session_id" ON "public"."sessions" USING "btree" ("session_id");
CREATE INDEX "idx_sessions_expires_at" ON "public"."sessions" USING "btree" ("expires_at");

ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_session_id_unique" UNIQUE ("session_id");

-- Create remember_me_tokens table
CREATE TABLE IF NOT EXISTS "public"."remember_me_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" character varying(255) NOT NULL,
    "ip_address" character varying(45),
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

ALTER TABLE "public"."remember_me_tokens" OWNER TO "postgres";

CREATE INDEX "idx_remember_me_tokens_user_id" ON "public"."remember_me_tokens" USING "btree" ("user_id");
CREATE INDEX "idx_remember_me_tokens_expires_at" ON "public"."remember_me_tokens" USING "btree" ("expires_at");

ALTER TABLE ONLY "public"."remember_me_tokens"
    ADD CONSTRAINT "remember_me_tokens_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."remember_me_tokens"
    ADD CONSTRAINT "remember_me_tokens_token_hash_unique" UNIQUE ("token_hash");

-- Create csrf_tokens table
CREATE TABLE IF NOT EXISTS "public"."csrf_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_hash" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

ALTER TABLE "public"."csrf_tokens" OWNER TO "postgres";

CREATE INDEX "idx_csrf_tokens_expires_at" ON "public"."csrf_tokens" USING "btree" ("expires_at");

ALTER TABLE ONLY "public"."csrf_tokens"
    ADD CONSTRAINT "csrf_tokens_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."csrf_tokens"
    ADD CONSTRAINT "csrf_tokens_token_hash_unique" UNIQUE ("token_hash");

-- Add RLS policies for audit_logs (append-only)
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_append_only" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_logs_select_own" ON "public"."audit_logs" FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
);

-- Add RLS policies for sessions
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON "public"."sessions" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON "public"."sessions" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON "public"."sessions" FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for remember_me_tokens
ALTER TABLE "public"."remember_me_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "remember_me_tokens_select_own" ON "public"."remember_me_tokens" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "remember_me_tokens_insert_own" ON "public"."remember_me_tokens" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "remember_me_tokens_delete_own" ON "public"."remember_me_tokens" FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for login_attempts
ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_insert_all" ON "public"."login_attempts" FOR INSERT WITH CHECK (true);
CREATE POLICY "login_attempts_select_own" ON "public"."login_attempts" FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
);
