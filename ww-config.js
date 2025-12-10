export default {
  editor: {
    label: {
      en: 'Node Config Sidebar',
    },
    icon: 'settings',
    customStylePropertiesOrder: [
      'panelWidth',
    ],
    customSettingsPropertiesOrder: [
      'selectedNodeData',
      'collections',
      'messageTemplates',
      'channels',
    ],
  },
  triggerEvents: [
    {
      name: 'config-saved',
      label: { en: 'On Config Saved' },
      event: { nodeId: '', config: {} },
      default: true,
    },
    {
      name: 'config-cancelled',
      label: { en: 'On Config Cancelled' },
      event: { nodeId: '' },
      default: true,
    },
    {
      name: 'panel-closed',
      label: { en: 'On Panel Closed' },
      event: {},
      default: true,
    },
    {
      name: 'validation-error',
      label: { en: 'On Validation Error' },
      event: { errors: [] },
      default: true,
    },
    {
      name: 'node-loaded',
      label: { en: 'On Node Loaded' },
      event: { nodeId: '', nodeType: '' },
      default: true,
    },
  ],
  properties: {
    // Settings Section
    selectedNodeData: {
      label: { en: 'Selected Node Data' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind the selected node data from Workflow Builder' },
      },
      bindable: true,
      defaultValue: {},
      /* wwEditor:start */
      bindingValidation: {
        type: 'object',
        tooltip: 'Bind to WorkflowBuilder selectedNodeData variable. Structure: {id, type, position, data: {label, ...config}}',
      },
      /* wwEditor:end */
    },
    collections: {
      label: { en: 'Available Collections' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind array of collections with fields' },
      },
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array of collections: [{name, label, fields: [{name, label, type}]}]. Field types: string, number, boolean, date, array, uuid',
      },
      /* wwEditor:end */
    },
    messageTemplates: {
      label: { en: 'Message Templates' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind array of message templates' },
      },
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array of message templates: [{id, name, channel, content}]',
      },
      /* wwEditor:end */
    },
    channels: {
      label: { en: 'Available Channels' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'push', label: 'Push Notification' },
        { value: 'line', label: 'LINE' },
      ],
      options: {
        expandable: true,
        getItemLabel(item, index) {
          return item?.label || item?.value || `Channel ${index + 1}`;
        },
        item: {
          type: 'Object',
          defaultValue: { value: '', label: '' },
          options: {
            item: {
              value: {
                label: { en: 'Value' },
                type: 'Text',
              },
              label: {
                label: { en: 'Label' },
                type: 'Text',
              },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array of channels: [{value, label}]',
      },
      /* wwEditor:end */
    },

    // Style Section
    panelWidth: {
      label: { en: 'Panel Width' },
      type: 'Length',
      section: 'style',
      defaultValue: '360px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'CSS width value (e.g., 360px, 25vw)',
      },
      /* wwEditor:end */
    },
  },
};
