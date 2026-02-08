<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
});

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

const api = useWorkbenchApi();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const org = ref<Organization | null>(null);
const formName = ref('');
const formSlug = ref('');

// Track if form has been modified
const isModified = computed(() => {
  if (!org.value) return false;
  return formName.value !== org.value.name || formSlug.value !== org.value.slug;
});

// Slug validation
const slugRegex = /^[a-z0-9-]+$/;
const slugError = computed(() => {
  if (!formSlug.value.trim()) {
    return 'Slug is required';
  }
  if (!slugRegex.test(formSlug.value)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens';
  }
  if (formSlug.value.startsWith('-') || formSlug.value.endsWith('-')) {
    return 'Slug cannot start or end with a hyphen';
  }
  return null;
});

const nameError = computed(() => {
  if (!formName.value.trim()) {
    return 'Organization name is required';
  }
  return null;
});

const isValid = computed(() => {
  return !nameError.value && !slugError.value;
});

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get<{ data: Organization }>('/api/admin/org');
    org.value = response.data;
    formName.value = response.data.name;
    formSlug.value = response.data.slug;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load organization settings.';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!isValid.value || saving.value || !isModified.value) {
    return;
  }

  saving.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const response = await api.patch<{ data: Organization }>('/api/admin/org', {
      name: formName.value.trim(),
      slug: formSlug.value.trim().toLowerCase()
    });

    org.value = response.data;
    formName.value = response.data.name;
    formSlug.value = response.data.slug;
    successMessage.value = 'Organization settings saved successfully.';

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const httpError = err as { statusCode: number; statusMessage?: string };
      if (httpError.statusCode === 409) {
        error.value = 'This slug is already in use by another organization.';
      } else {
        error.value = httpError.statusMessage || 'Failed to save organization settings.';
      }
    } else {
      error.value = err instanceof Error ? err.message : 'Failed to save organization settings.';
    }
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  if (org.value) {
    formName.value = org.value.name;
    formSlug.value = org.value.slug;
  }
  error.value = null;
  successMessage.value = null;
};

// Normalize slug input (lowercase, replace spaces and special chars)
const normalizeSlug = () => {
  formSlug.value = formSlug.value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

onMounted(load);
</script>

<template>
  <div class="settings-page">
    <UiPageHeader
      title="Organization Settings"
      subtitle="Manage your organization's name and URL slug."
    />

    <!-- Loading State -->
    <p v-if="loading" class="loading-text">Loading organization settings...</p>

    <!-- Error State (when loading fails) -->
    <div v-else-if="error && !org" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button type="button" class="retry-button" @click="load">
        Try again
      </button>
    </div>

    <!-- Settings Form -->
    <template v-else-if="org">
      <!-- Success Message -->
      <div v-if="successMessage" class="success-banner">
        <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Error Message (when saving fails) -->
      <div v-if="error" class="error-banner">
        <span>{{ error }}</span>
        <button type="button" class="error-dismiss" @click="error = null">Dismiss</button>
      </div>

      <!-- General Settings Section -->
      <section class="settings-section">
        <UiSectionHeader label="general" />

        <div class="settings-card">
          <form @submit.prevent="save">
            <!-- Organization Name -->
            <div class="form-group">
              <label for="org-name" class="form-label">Organization Name</label>
              <input
                id="org-name"
                v-model="formName"
                type="text"
                class="form-input"
                :class="{ 'form-input--error': nameError && formName !== org.name }"
                placeholder="Enter organization name"
              />
              <p v-if="nameError && formName !== org.name" class="form-error">
                {{ nameError }}
              </p>
              <p class="form-hint">
                The display name of your organization.
              </p>
            </div>

            <!-- Organization Slug -->
            <div class="form-group">
              <label for="org-slug" class="form-label">Organization Slug</label>
              <div class="slug-input-wrapper">
                <span class="slug-prefix">workbench.app/</span>
                <input
                  id="org-slug"
                  v-model="formSlug"
                  type="text"
                  class="form-input slug-input"
                  :class="{ 'form-input--error': slugError && formSlug !== org.slug }"
                  placeholder="my-organization"
                  @blur="normalizeSlug"
                />
              </div>
              <p v-if="slugError && formSlug !== org.slug" class="form-error">
                {{ slugError }}
              </p>
              <p class="form-hint">
                URL-safe identifier. Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button
                type="button"
                class="button button--secondary"
                :disabled="!isModified || saving"
                @click="resetForm"
              >
                Reset
              </button>
              <button
                type="submit"
                class="button button--primary"
                :disabled="!isModified || !isValid || saving"
              >
                <template v-if="saving">
                  <span class="button-spinner"></span>
                  Saving...
                </template>
                <template v-else>
                  Save Changes
                </template>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- Danger actions are intentionally hidden until fully implemented -->
    </template>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: var(--content-max-width);
}

/* Loading State */
.loading-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12);
  text-align: center;
}

.error-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.retry-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

/* Success Banner */
.success-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.success-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.error-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.error-dismiss:hover {
  background: var(--color-bg-hover);
}

/* Settings Section */
.settings-section {
  margin-bottom: var(--space-10);
}

/* Settings Card */
.settings-card {
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Form Styles */
.form-group {
  margin-bottom: var(--space-6);
}

.form-group:last-of-type {
  margin-bottom: var(--space-8);
}

.form-label {
  display: block;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  max-width: 400px;
  min-height: 44px;
  box-sizing: border-box;
  padding: var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.form-input--error {
  border-color: var(--color-border-strong);
}

.form-hint {
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.form-error {
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* Slug Input */
.slug-input-wrapper {
  display: flex;
  align-items: center;
  max-width: 400px;
  width: 100%;
}

.slug-prefix {
  padding: var(--space-3);
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.slug-input {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  max-width: none;
  flex: 1;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Buttons */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.button--primary {
  background: var(--color-text);
  color: var(--color-bg);
  border: 1px solid var(--color-text);
}

.button--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.button--secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.button--danger {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-strong);
}

.button--danger:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

/* Button Spinner */
.button-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Danger Zone */
.danger-section {
  margin-top: var(--space-12);
}

.danger-card {
  border-color: var(--color-border-strong);
}

.danger-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
}

@media (max-width: 600px) {
  .slug-input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .slug-prefix {
    border-right: 1px solid var(--color-border);
    border-bottom: none;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  .slug-input {
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  .danger-item {
    flex-direction: column;
    align-items: stretch;
  }
}

.danger-content {
  flex: 1;
}

.danger-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.danger-description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.danger-warning {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>
