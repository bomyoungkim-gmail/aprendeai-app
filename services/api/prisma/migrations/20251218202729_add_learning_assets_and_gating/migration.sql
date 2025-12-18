-- CreateEnum
CREATE TYPE "AssetLayer" AS ENUM ('L1', 'L2', 'L3');

-- CreateTable
CREATE TABLE "learning_assets" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "layer" "AssetLayer" NOT NULL,
    "modality" "SessionModality" NOT NULL,
    "body_ref" TEXT,
    "glossary_json" JSONB,
    "cues_json" JSONB,
    "checkpoints_json" JSONB,
    "quiz_post_json" JSONB,
    "difficulty_estimate" INTEGER,
    "length_estimate" INTEGER,
    "prompt_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layer_eligibility" (
    "user_id" TEXT NOT NULL,
    "eligible_l2" BOOLEAN NOT NULL DEFAULT false,
    "eligible_l3" BOOLEAN NOT NULL DEFAULT false,
    "reason_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layer_eligibility_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "learning_assets_content_id_layer_idx" ON "learning_assets"("content_id", "layer");

-- CreateIndex
CREATE INDEX "learning_assets_prompt_version_idx" ON "learning_assets"("prompt_version");

-- CreateIndex
CREATE UNIQUE INDEX "learning_assets_content_id_layer_modality_prompt_version_key" ON "learning_assets"("content_id", "layer", "modality", "prompt_version");

-- AddForeignKey
ALTER TABLE "learning_assets" ADD CONSTRAINT "learning_assets_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layer_eligibility" ADD CONSTRAINT "layer_eligibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
