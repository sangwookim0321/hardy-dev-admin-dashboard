<script>
</script>

<div class="loading-bar-container">
	<div class="loading-bar"></div>
</div>

<style>
	.loading-bar-container {
		width: 100%;
		height: 12px;
		background-color: #f0f0f0;
		overflow: hidden;
		border-radius: 10px;
	}
	.loading-bar {
		width: 15%;
		height: 100%;
		background-color: var(--main-bg-purple);
		animation: moveLoadingBar 2.5s infinite linear;
		border-radius: 10px;
	}

	@keyframes moveLoadingBar {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(150rem);
		}
	}

	@media (max-width: 768px) {
		.loading-bar-container {
			height: 8px;
		}
		.loading-bar {
			width: 20%;
			animation: moveLoadingBar 2.5s infinite linear;
		}
		@keyframes moveLoadingBar {
			0% {
				transform: translateX(-100%);
			}
			100% {
				transform: translateX(70rem);
			}
		}
	}
</style>
