<template>
  <span>{{ displayText }}<span v-if="showCursor" class="cursor">|</span></span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string;
    speed?: number;
    startDelay?: number;
    showCursor?: boolean;
    autoStart?: boolean;
  }>(),
  {
    speed: 50,
    startDelay: 0,
    showCursor: true,
    autoStart: true
  }
);

const emit = defineEmits<{
  complete: [];
}>();

const displayText = ref('');
const isTyping = ref(false);

const startTyping = async () => {
  if (isTyping.value) return;

  isTyping.value = true;

  // Start delay
  if (props.startDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, props.startDelay));
  }

  // Type character by character
  for (let i = 0; i <= props.text.length; i++) {
    displayText.value = props.text.substring(0, i);
    await new Promise(resolve => setTimeout(resolve, props.speed));
  }

  isTyping.value = false;
  emit('complete');
};

onMounted(() => {
  if (props.autoStart) {
    startTyping();
  }
});

defineExpose({
  startTyping
});
</script>

<style scoped>
.cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
</style>
