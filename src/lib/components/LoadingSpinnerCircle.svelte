<script>
</script>

<div class="loading-circle-container">
	<div class="loading-circle"></div>
</div>

<style>
	.loading-circle-container {
		width: 80px;
		height: 80px;
		position: relative;
		margin: 0 auto;
		margin-top: 2rem;
	}

	.loading-circle {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 6px solid #f0f0f0;
		border-top-color: var(--main-bg-gray);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.loading-circle-container {
			width: 50px;
			height: 50px;
		}
	}
</style>
