<template>
  <section class="testimonials-section">
    <div class="testimonials-container">
      <div class="section-header">
        <span class="section-label">trusted by teams</span>
        <h2 class="section-title">Built for BetterSignShop. Ready for you.</h2>
        <p class="section-description">
          Internal teams ship faster with less overhead. No enterprise bloat. No feature maze. Just clarity.
        </p>
      </div>

      <div class="testimonials-grid">
        <!-- Testimonial 1 -->
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p class="testimonial-text">
              "Finally, a project tool that doesn't feel like homework. Everything lives in documents, tasks appear where they need to, and the AI actually helps instead of getting in the way."
            </p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">M</div>
            <div class="author-info">
              <div class="author-name">Michael K.</div>
              <div class="author-role">Founder, BetterSignShop</div>
            </div>
          </div>
        </div>

        <!-- Testimonial 2 -->
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p class="testimonial-text">
              "We ditched Notion after two weeks with Workbench. Documents don't need databases. Tasks don't need ten custom fields. Speed wins."
            </p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">S</div>
            <div class="author-info">
              <div class="author-name">Sarah M.</div>
              <div class="author-role">Product Designer</div>
            </div>
          </div>
        </div>

        <!-- Testimonial 3 -->
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p class="testimonial-text">
              "The three-view system is genius. Same task data, three perspectives. List for prioritization, kanban for workflow, calendar for deadlines. No sync issues, ever."
            </p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">J</div>
            <div class="author-info">
              <div class="author-name">Jake L.</div>
              <div class="author-role">Engineering Lead</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">150ms</div>
          <div class="stat-label">avg transition time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">task views, one index</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">drop shadows used</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">100%</div>
          <div class="stat-label">grayscale palette</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Static testimonials component
</script>

<style scoped>
.testimonials-section {
  padding: var(--space-12) var(--space-6);
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
}

.testimonials-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--space-12);
}

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: var(--tracking-label);
  display: block;
  margin-bottom: var(--space-4);
}

.section-title {
  font-family: var(--font-body);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: var(--tracking-h1);
  color: var(--color-text);
  margin: 0 0 var(--space-4);
}

.section-description {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-12);
}

.testimonial-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.testimonial-card:hover {
  transform: translateY(-4px);
}

.testimonial-content {
  flex: 1;
}

.testimonial-text {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 0;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.author-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-bg-active);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.author-role {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-border);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 300;
  line-height: 1.0;
  letter-spacing: -0.03em;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

/* Mobile */
@media (max-width: 768px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 28px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }

  .stat-value {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 24px;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
