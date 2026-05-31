-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `call_occupied_until` DATETIME(3) NULL,
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `phone_number` VARCHAR(191) NULL,
    `reset_token` VARCHAR(191) NULL,
    `reset_token_expires_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'offline',
    `google_id` VARCHAR(191) NULL,
    `google_access_token` VARCHAR(191) NULL,
    `google_refresh_token` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `verification_token` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    UNIQUE INDEX `users_google_id_key`(`google_id`),
    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_phone_number_idx`(`phone_number`),
    INDEX `users_google_id_idx`(`google_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `refresh_token` VARCHAR(500) NULL,
    `device_info` JSON NOT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `refresh_expires_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_key`(`token`),
    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_token_idx`(`token`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `avatar_url` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `last_message_id` VARCHAR(191) NULL,

    INDEX `conversations_type_idx`(`type`),
    INDEX `conversations_created_by_idx`(`created_by`),
    INDEX `conversations_last_message_at_idx`(`last_message_at`),
    INDEX `conversations_is_archived_idx`(`is_archived`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_users` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,
    `is_muted` BOOLEAN NOT NULL DEFAULT false,
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `notifications` VARCHAR(191) NOT NULL DEFAULT 'all',
    `custom_notification` BOOLEAN NOT NULL DEFAULT false,

    INDEX `conversation_users_conversation_id_idx`(`conversation_id`),
    INDEX `conversation_users_user_id_idx`(`user_id`),
    INDEX `conversation_users_user_id_is_pinned_idx`(`user_id`, `is_pinned`),
    UNIQUE INDEX `conversation_users_conversation_id_user_id_key`(`conversation_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `reply_to_id` VARCHAR(191) NULL,
    `is_edited` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_by` JSON NOT NULL,
    `forwarded_from_id` VARCHAR(191) NULL,
    `is_recalled` BOOLEAN NOT NULL DEFAULT false,
    `message_type` VARCHAR(191) NOT NULL DEFAULT 'text',

    INDEX `messages_conversation_id_idx`(`conversation_id`),
    INDEX `messages_sender_id_idx`(`sender_id`),
    INDEX `messages_created_at_idx`(`created_at`),
    INDEX `messages_reply_to_id_idx`(`reply_to_id`),
    INDEX `messages_conversation_id_created_at_idx`(`conversation_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_status` (
    `id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `seen_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `message_status_message_id_idx`(`message_id`),
    INDEX `message_status_user_id_idx`(`user_id`),
    INDEX `message_status_seen_at_idx`(`seen_at`),
    UNIQUE INDEX `message_status_message_id_user_id_key`(`message_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unread_messages` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `last_read_message_id` VARCHAR(191) NULL,
    `unread_count` INTEGER NOT NULL DEFAULT 0,
    `last_unread_at` DATETIME(3) NULL,
    `has_unreplied` BOOLEAN NOT NULL DEFAULT false,
    `last_unreplied_msg_id` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `unread_messages_user_id_conversation_id_idx`(`user_id`, `conversation_id`),
    INDEX `unread_messages_user_id_has_unreplied_idx`(`user_id`, `has_unreplied`),
    INDEX `unread_messages_conversation_id_fkey`(`conversation_id`),
    UNIQUE INDEX `unread_messages_user_id_conversation_id_key`(`user_id`, `conversation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pinned_documents` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `pinned_by` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `pinned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pin_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `pinned_documents_conversation_id_idx`(`conversation_id`),
    INDEX `pinned_documents_pinned_by_idx`(`pinned_by`),
    INDEX `pinned_documents_conversation_id_pin_order_idx`(`conversation_id`, `pin_order`),
    INDEX `pinned_documents_message_id_fkey`(`message_id`),
    UNIQUE INDEX `pinned_documents_conversation_id_message_id_key`(`conversation_id`, `message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `nickname` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invited_by` VARCHAR(191) NULL,

    INDEX `group_members_conversation_id_idx`(`conversation_id`),
    INDEX `group_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `group_members_conversation_id_user_id_key`(`conversation_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calls` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `caller_id` VARCHAR(191) NOT NULL,
    `callee_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `started_at` DATETIME(3) NULL,
    `ended_at` DATETIME(3) NULL,
    `duration` INTEGER NULL DEFAULT 0,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `calls_conversation_id_idx`(`conversation_id`),
    INDEX `calls_caller_id_idx`(`caller_id`),
    INDEX `calls_callee_id_idx`(`callee_id`),
    INDEX `calls_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_users` ADD CONSTRAINT `conversation_users_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_users` ADD CONSTRAINT `conversation_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_reply_to_id_fkey` FOREIGN KEY (`reply_to_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_status` ADD CONSTRAINT `message_status_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_status` ADD CONSTRAINT `message_status_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unread_messages` ADD CONSTRAINT `unread_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unread_messages` ADD CONSTRAINT `unread_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_documents` ADD CONSTRAINT `pinned_documents_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_documents` ADD CONSTRAINT `pinned_documents_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_documents` ADD CONSTRAINT `pinned_documents_pinned_by_fkey` FOREIGN KEY (`pinned_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_callee_id_fkey` FOREIGN KEY (`callee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_caller_id_fkey` FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
