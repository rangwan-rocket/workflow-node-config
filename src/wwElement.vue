<template>
  <div
    v-if="shouldShowPanel"
    class="polaris-sidebar"
    :style="panelStyle"
  >
    <!-- Header -->
    <div class="polaris-sidebar__header">
      <div class="polaris-sidebar__header-left">
        <span class="polaris-sidebar__icon" :class="`polaris-sidebar__icon--${currentNodeType}`">
          {{ nodeTypeIcons[currentNodeType] || '⚙️' }}
        </span>
        <div class="polaris-sidebar__header-info">
          <span class="polaris-sidebar__type-label">{{ nodeTypeLabels[currentNodeType] || 'Node' }}</span>
          <input
            v-model="editingConfig.label"
            class="polaris-sidebar__title-input"
            placeholder="Node label"
            @input="markChanged"
          />
        </div>
      </div>
      <button class="polaris-button polaris-button--plain polaris-button--icon-only" @click="handleClose" title="Close">
        <svg viewBox="0 0 20 20" class="polaris-icon">
          <path d="M11.414 10l4.293-4.293a1 1 0 00-1.414-1.414L10 8.586 5.707 4.293a1 1 0 00-1.414 1.414L8.586 10l-4.293 4.293a1 1 0 101.414 1.414L10 11.414l4.293 4.293a1 1 0 001.414-1.414L11.414 10z" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="polaris-sidebar__content">
      <!-- Node Type Configs -->
      <ConditionConfig
        v-if="currentNodeType === 'condition'"
        :config="editingConfig"
        :collections="collectionsData"
        @update="handleConfigUpdate"
      />

      <MessageConfig
        v-else-if="currentNodeType === 'message'"
        :config="editingConfig"
        :channels="channelsData"
        :templates="messageTemplatesData"
        @update="handleConfigUpdate"
      />

      <WaitConfig
        v-else-if="currentNodeType === 'wait'"
        :config="editingConfig"
        @update="handleConfigUpdate"
      />

      <ApiConfig
        v-else-if="currentNodeType === 'api'"
        :config="editingConfig"
        @update="handleConfigUpdate"
      />

      <!-- Unknown Node Type -->
      <div v-else-if="currentNodeType && !showEditorPlaceholder" class="polaris-banner polaris-banner--warning">
        <svg viewBox="0 0 20 20" class="polaris-banner__icon">
          <path d="M10 18a8 8 0 110-16 8 8 0 010 16zM9 9a1 1 0 002 0V7a1 1 0 00-2 0v2zm0 4a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor"/>
        </svg>
        <div class="polaris-banner__content">
          <p class="polaris-banner__message">Unknown node type: {{ currentNodeType }}</p>
        </div>
      </div>

      <!-- Editor Placeholder -->
      <div v-else-if="showEditorPlaceholder" class="polaris-empty-state">
        <div class="polaris-empty-state__icon">🔧</div>
        <h3 class="polaris-text polaris-text--heading-md">Node Config Sidebar</h3>
        <p class="polaris-text polaris-text--body-md polaris-text--subdued">
          Bind <strong>Selected Node Data</strong> from your Workflow Builder component to configure nodes.
        </p>
        <div class="polaris-empty-state__types">
          <span class="polaris-badge polaris-badge--attention">🔀 Condition</span>
          <span class="polaris-badge polaris-badge--info">✉️ Message</span>
          <span class="polaris-badge polaris-badge--default">⏱️ Wait</span>
          <span class="polaris-badge polaris-badge--success">🔌 API</span>
        </div>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrorsList.length > 0" class="polaris-banner polaris-banner--critical">
        <svg viewBox="0 0 20 20" class="polaris-banner__icon">
          <path d="M10 18a8 8 0 110-16 8 8 0 010 16zM9 9a1 1 0 002 0V7a1 1 0 00-2 0v2zm0 4a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor"/>
        </svg>
        <div class="polaris-banner__content">
          <p class="polaris-banner__title">Validation errors</p>
          <ul class="polaris-banner__list">
            <li v-for="(error, idx) in validationErrorsList" :key="idx">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="polaris-sidebar__footer">
      <button class="polaris-button polaris-button--default" @click="handleCancel">Cancel</button>
      <button class="polaris-button polaris-button--primary" :disabled="!isValidConfig" @click="handleSave">Save</button>
    </div>
  </div>
</template>

<script>
import { computed, watch, ref } from 'vue';
import ConditionConfig from './components/ConditionConfig.vue';
import MessageConfig from './components/MessageConfig.vue';
import WaitConfig from './components/WaitConfig.vue';
import ApiConfig from './components/ApiConfig.vue';

export default {
  components: {
    ConditionConfig,
    MessageConfig,
    WaitConfig,
    ApiConfig,
  },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit, expose }) {
    // Node type configurations
    const nodeTypeLabels = {
      condition: 'Condition',
      message: 'Message',
      wait: 'Wait',
      api: 'API Call',
    };

    const nodeTypeIcons = {
      condition: '🔀',
      message: '✉️',
      wait: '⏱️',
      api: '🔌',
    };

    // Default configs per node type
    const getDefaultConfig = (nodeType) => {
      const configs = {
        condition: {
          label: 'Condition',
          groups_operator: 'AND',
          groups: [{
            id: crypto.randomUUID(),
            operator: 'AND',
            collection: '',
            conditions: [{
              id: crypto.randomUUID(),
              field: '',
              operator: 'equals',
              value: '',
              value_type: 'static',
            }],
          }],
        },
        message: {
          label: 'Send Message',
          channel: '',
          template_id: null,
          subject: '',
          content: '',
          json_content: null,
        },
        wait: {
          label: 'Wait 1 days',
          duration: 1,
          unit: 'days',
        },
        api: {
          label: 'API Call',
          method: 'GET',
          url: '',
          headers: {},
          body: null,
          timeout_seconds: 30,
          retry_count: 0,
        },
      };
      return configs[nodeType] || {};
    };

    // Local editing state
    const editingConfig = ref({});
    const originalConfig = ref({});

    // Exposed variables using wwLib
    const { value: editingConfigVar, setValue: setEditingConfigVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'editingConfig',
      type: 'object',
      defaultValue: {},
    });

    const { value: hasChanges, setValue: setHasChanges } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'hasChanges',
      type: 'boolean',
      defaultValue: false,
    });

    const { value: isValid, setValue: setIsValid } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'isValid',
      type: 'boolean',
      defaultValue: true,
    });

    const { value: validationErrors, setValue: setValidationErrors } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'validationErrors',
      type: 'array',
      defaultValue: [],
    });

    const { value: currentNodeTypeVar, setValue: setCurrentNodeType } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentNodeType',
      type: 'string',
      defaultValue: '',
    });

    // Computed props data
    const selectedNodeData = computed(() => props.content?.selectedNodeData || null);
    const collectionsData = computed(() => props.content?.collections || []);
    const channelsData = computed(() => props.content?.channels || []);
    const messageTemplatesData = computed(() => props.content?.messageTemplates || []);
    const panelWidth = computed(() => props.content?.panelWidth || '360px');
    const currentNodeType = computed(() => currentNodeTypeVar.value || '');

    const hasSelectedNode = computed(() => {
      const data = selectedNodeData.value;
      return data && typeof data === 'object' && data.id;
    });

    /* wwEditor:start */
    const isEditing = computed(() => props.wwEditorState?.sidepanelContent);
    /* wwEditor:end */

    const shouldShowPanel = computed(() => {
      /* wwEditor:start */
      if (isEditing.value || !hasSelectedNode.value) return true;
      /* wwEditor:end */
      return hasSelectedNode.value;
    });

    const showEditorPlaceholder = computed(() => {
      /* wwEditor:start */
      return !hasSelectedNode.value;
      /* wwEditor:end */
      return false;
    });

    const panelStyle = computed(() => ({ width: panelWidth.value }));
    const validationErrorsList = computed(() => validationErrors.value || []);
    const isValidConfig = computed(() => isValid.value);

    // Deep clone helper
    const deepClone = (obj) => {
      if (obj === null || obj === undefined) return obj;
      return JSON.parse(JSON.stringify(obj));
    };

    // Initialize editing config when selected node changes
    watch(selectedNodeData, (newData) => {
      if (newData && typeof newData === 'object' && newData.id) {
        const nodeType = newData.type || '';
        const nodeConfig = newData.data || {};
        const defaultConfig = getDefaultConfig(nodeType);
        const mergedConfig = { ...deepClone(defaultConfig), ...deepClone(nodeConfig) };
        
        editingConfig.value = mergedConfig;
        originalConfig.value = deepClone(mergedConfig);
        
        setEditingConfigVar(mergedConfig);
        setCurrentNodeType(nodeType);
        setHasChanges(false);
        setValidationErrors([]);
        setIsValid(true);
      } else {
        editingConfig.value = {};
        originalConfig.value = {};
        setEditingConfigVar({});
        setCurrentNodeType('');
        setHasChanges(false);
        setValidationErrors([]);
        setIsValid(true);
      }
    }, { immediate: true, deep: true });

    // Mark as changed and validate
    const markChanged = () => {
      setHasChanges(true);
      setEditingConfigVar({ ...editingConfig.value });
      validate();
    };

    // Handle config update from child components
    const handleConfigUpdate = (newConfig) => {
      editingConfig.value = newConfig;
      markChanged();
    };

    // Validation
    const validate = () => {
      const errors = [];
      const config = editingConfig.value;
      const nodeType = currentNodeType.value;

      if (nodeType === 'condition') {
        const groups = config?.groups || [];
        if (groups.length === 0) {
          errors.push('At least one condition group is required');
        }
        groups.forEach((group, gIdx) => {
          if (!group?.collection) {
            errors.push(`Group ${gIdx + 1}: Collection is required`);
          }
          const conditions = group?.conditions || [];
          if (conditions.length === 0) {
            errors.push(`Group ${gIdx + 1}: At least one condition is required`);
          }
          conditions.forEach((condition, cIdx) => {
            if (!condition?.field) {
              errors.push(`Group ${gIdx + 1}, Condition ${cIdx + 1}: Field is required`);
            }
          });
        });
      } else if (nodeType === 'message') {
        if (!config?.channel) {
          errors.push('Channel is required');
        }
        if (!config?.template_id && !config?.content) {
          errors.push('Either template or content is required');
        }
        if (config?.channel === 'email' && !config?.subject) {
          errors.push('Subject is required for email');
        }
      } else if (nodeType === 'wait') {
        if (!config?.duration || config.duration <= 0) {
          errors.push('Duration must be greater than 0');
        }
      } else if (nodeType === 'api') {
        if (!config?.url) {
          errors.push('URL is required');
        }
      }

      setValidationErrors(errors);
      setIsValid(errors.length === 0);
    };

    // Actions
    const handleSave = () => {
      validate();
      if (!isValid.value) {
        emit('trigger-event', { name: 'validation-error', event: { errors: validationErrors.value } });
        return;
      }
      const nodeData = selectedNodeData.value;
      emit('trigger-event', {
        name: 'config-saved',
        event: { nodeId: nodeData?.id, config: deepClone(editingConfig.value) },
      });
    };

    const handleCancel = () => {
      editingConfig.value = deepClone(originalConfig.value);
      setEditingConfigVar(editingConfig.value);
      setHasChanges(false);
      setValidationErrors([]);
      setIsValid(true);
      const nodeData = selectedNodeData.value;
      emit('trigger-event', { name: 'config-cancelled', event: { nodeId: nodeData?.id } });
    };

    const handleClose = () => {
      emit('trigger-event', { name: 'panel-closed', event: {} });
    };

    // Programmatic methods for external calls
    const setNodeData = (nodeData) => {
      if (nodeData && typeof nodeData === 'object' && nodeData.id) {
        const nodeType = nodeData.type || '';
        const nodeConfig = nodeData.data || {};
        const defaultConfig = getDefaultConfig(nodeType);
        const mergedConfig = { ...deepClone(defaultConfig), ...deepClone(nodeConfig) };
        
        editingConfig.value = mergedConfig;
        originalConfig.value = deepClone(mergedConfig);
        
        setEditingConfigVar(mergedConfig);
        setCurrentNodeType(nodeType);
        setHasChanges(false);
        setValidationErrors([]);
        setIsValid(true);
        
        emit('trigger-event', { name: 'node-loaded', event: { nodeId: nodeData.id, nodeType } });
      }
    };

    const clearNodeData = () => {
      editingConfig.value = {};
      originalConfig.value = {};
      setEditingConfigVar({});
      setCurrentNodeType('');
      setHasChanges(false);
      setValidationErrors([]);
      setIsValid(true);
      emit('trigger-event', { name: 'panel-closed', event: {} });
    };

    const getConfig = () => {
      return deepClone(editingConfig.value);
    };

    // Expose methods for external use (Component Actions)
    expose({
      // Data actions
      setNodeData,      // Call to load a node for editing
      clearNodeData,    // Call to clear/close the sidebar
      getConfig,        // Get current config without saving
      
      // Edit actions
      save: handleSave,
      cancel: handleCancel,
      validate,
      resetToOriginal: handleCancel,
    });

    return {
      // Data
      nodeTypeLabels,
      nodeTypeIcons,
      editingConfig,
      collectionsData,
      channelsData,
      messageTemplatesData,
      currentNodeType,
      // Computed
      shouldShowPanel,
      showEditorPlaceholder,
      panelStyle,
      validationErrorsList,
      isValidConfig,
      // Methods
      markChanged,
      handleConfigUpdate,
      handleSave,
      handleCancel,
      handleClose,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

// Apply tokens to root
.polaris-sidebar {
  @include polaris-tokens;
}

// ==================== LAYOUT ====================
.polaris-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--p-color-bg);
  border-left: 1px solid var(--p-color-border);
  font-family: var(--p-font-family-sans);
  overflow: hidden;
}

.polaris-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-400);
  background: var(--p-color-bg-surface);
  border-bottom: 1px solid var(--p-color-border);
}

.polaris-sidebar__header-left {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
  flex: 1;
  min-width: 0;
}

.polaris-sidebar__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-color-bg-fill);
  border-radius: var(--p-border-radius-200);
  font-size: 18px;

  &--condition { background: var(--p-color-bg-fill-warning-secondary); }
  &--message { background: var(--p-color-bg-fill-info-secondary); }
  &--wait { background: #e0e7ff; }
  &--api { background: var(--p-color-bg-fill-success-secondary); }
}

.polaris-sidebar__header-info {
  flex: 1;
  min-width: 0;
}

.polaris-sidebar__type-label {
  @include polaris-text-body-subdued;
  font-size: var(--p-font-size-300);
  display: block;
}

.polaris-sidebar__title-input {
  @include polaris-text-heading-sm;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  outline: none;

  &:focus {
    outline: none;
  }
}

.polaris-sidebar__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--p-space-400);
}

.polaris-sidebar__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--p-space-200);
  padding: var(--p-space-400);
  background: var(--p-color-bg-surface);
  border-top: 1px solid var(--p-color-border);
}

// ==================== BUTTONS ====================
.polaris-button {
  @include polaris-button-base;

  &--default { @include polaris-button-default; }
  &--primary { @include polaris-button-primary; }
  &--plain { @include polaris-button-plain; }
  &--critical { color: var(--p-color-text-critical); }
  &--outline { @include polaris-button-outline; }
  &--slim { @include polaris-button-slim; }
  &--full-width { @include polaris-button-full-width; }
  &--icon-only { @include polaris-button-icon-only; }

  &--segmented {
    border-radius: 0;
    background: var(--p-color-bg-surface);
    color: var(--p-color-text);
    box-shadow: inset 0 0 0 1px var(--p-color-border);
    
    &:first-child { border-radius: var(--p-border-radius-200) 0 0 var(--p-border-radius-200); }
    &:last-child { border-radius: 0 var(--p-border-radius-200) var(--p-border-radius-200) 0; }
  }

  &--segmented-selected {
    background: var(--p-color-bg-surface-selected);
    color: var(--p-color-text-brand);
    box-shadow: inset 0 0 0 2px var(--p-color-border-brand);
  }
}

.polaris-button-group {
  @include polaris-button-group;
  
  &--segmented { @include polaris-button-group-segmented; }
  &--small .polaris-button { @include polaris-button-slim; }
}

// ==================== CARDS ====================
.polaris-card {
  @include polaris-card;
  
  &--subdued { @include polaris-card-subdued; }
  
  & + & { margin-top: var(--p-space-400); }
}

.polaris-card__section {
  @include polaris-card-section;
}

// ==================== FORMS ====================
.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);

  &--flex { flex: 1; }
  &--operator { width: 120px; flex-shrink: 0; }
}

.polaris-text-field__label {
  @include polaris-label;

  &--required::after {
    content: ' *';
    color: var(--p-color-text-critical);
  }
}

.polaris-text-field__input {
  @include polaris-input;

  &--multiline { @include polaris-textarea; }
  &--monospace { font-family: var(--p-font-family-mono); font-size: var(--p-font-size-300); }
}

.polaris-text-field__help-text { @include polaris-help-text; }
.polaris-text-field__error { @include polaris-error-text; }

.polaris-select__input { @include polaris-select; }

// ==================== LAYOUT UTILITIES ====================
.polaris-inline {
  @include polaris-inline;
  
  &--space-between { justify-content: space-between; }
  &--gap-tight { gap: var(--p-space-200); }
  &--align-end { align-items: flex-end; }
}

.polaris-block-stack {
  @include polaris-block-stack;
  
  &--tight { gap: var(--p-space-200); }
}

// ==================== TEXT ====================
.polaris-text {
  &--heading-sm { @include polaris-text-heading-sm; }
  &--heading-md { @include polaris-text-heading-md; }
  &--body-md { @include polaris-text-body; }
  &--subdued { color: var(--p-color-text-secondary); }
}

// ==================== BADGES ====================
.polaris-badge {
  @include polaris-badge-default;
  
  &--info { @include polaris-badge-info; }
  &--success { @include polaris-badge-success; }
  &--attention { @include polaris-badge-warning; }
  &--default { @include polaris-badge-default; }
}

// ==================== BANNERS ====================
.polaris-banner {
  @include polaris-banner-base;
  
  &--info { @include polaris-banner-info; }
  &--warning { @include polaris-banner-warning; }
  &--critical { @include polaris-banner-critical; }
}

.polaris-banner__icon { @include polaris-icon; flex-shrink: 0; }
.polaris-banner__content { flex: 1; }
.polaris-banner__title { @include polaris-text-heading-sm; margin-bottom: var(--p-space-100); }
.polaris-banner__message { @include polaris-text-body; margin: 0; }
.polaris-banner__list { @include polaris-list-bulleted; margin-top: var(--p-space-100); }

// ==================== ICONS ====================
.polaris-icon {
  @include polaris-icon;
  
  &--small { @include polaris-icon-small; }
}

// ==================== CONDITION BUILDER ====================
.polaris-condition-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
  margin-top: var(--p-space-300);
}

.polaris-condition-item {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
}

.polaris-condition-operator {
  display: flex;
  justify-content: center;
  padding: var(--p-space-100) 0;
}

.polaris-condition-fields {
  display: flex;
  gap: var(--p-space-200);
  align-items: flex-end;
}

// ==================== EMPTY STATE ====================
.polaris-empty-state {
  @include polaris-empty-state;
  min-height: 300px;
}

.polaris-empty-state__icon {
  font-size: 48px;
  margin-bottom: var(--p-space-400);
}

.polaris-empty-state__heading {
  @include polaris-empty-state-heading;
}

.polaris-empty-state__content {
  @include polaris-empty-state-content;
}

.polaris-empty-state__types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--p-space-200);
  justify-content: center;
  margin-top: var(--p-space-400);
}
</style>
