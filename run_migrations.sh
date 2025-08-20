#!/bin/bash

# Supabase Migration Script
# Run this after setting your database password

echo "🚀 Starting Supabase migration..."

# Check if password is set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD not set"
    echo "Please run: export SUPABASE_DB_PASSWORD='your-password'"
    exit 1
fi

PROJECT_REF="xewzprfamxswxtmzucbt"

echo "📦 Linking to project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF --password $SUPABASE_DB_PASSWORD

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "🔄 Pushing migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed"
    exit 1
fi

echo "📊 Current migration status:"
supabase db migrations list