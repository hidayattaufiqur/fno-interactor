<script>
  import { page } from '$app/stores'
</script>

<div class="error-page">
  <p class="eyebrow">Error {$page.status}</p>
  <h2>{$page.error?.message ?? 'Something went wrong'}</h2>
  <a href="/" class="nav-link">← Back to home</a>
</div>

<style>
  .error-page {
    padding: 48px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
