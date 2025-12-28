-- SUBFASE 2.1: Add Foreign Key Constraints to Phase 1 EXPAND Tables

-- Add FK: TeacherVerification.userId -> User.id
ALTER TABLE "teacher_verifications" 
ADD CONSTRAINT "teacher_verifications_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK: TeacherVerification.institutionId -> Institution.id
ALTER TABLE "teacher_verifications" 
ADD CONSTRAINT "teacher_verifications_institution_id_fkey" 
FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK: ContentShare.contentId -> Content.id
ALTER TABLE "content_shares" 
ADD CONSTRAINT "content_shares_content_id_fkey" 
FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK: AnnotationShare.annotationId -> Annotation.id
ALTER TABLE "annotation_shares" 
ADD CONSTRAINT "annotation_shares_annotation_id_fkey" 
FOREIGN KEY ("annotation_id") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK: Comment.authorId -> User.id  
ALTER TABLE "comments" 
ADD CONSTRAINT "comments_author_id_fkey" 
FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK: InstitutionPolicy.institutionId -> Institution.id
ALTER TABLE "institution_policies" 
ADD CONSTRAINT "institution_policies_institution_id_fkey" 
FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
