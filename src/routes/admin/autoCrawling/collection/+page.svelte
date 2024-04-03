<!-- 크롤링 페이지 -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores.js';
	import { storePath, storeLoadingState } from '$lib/store/store';
	import { showToast, showAlert } from '$lib/util/alerts';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import LoadingSpinnerCircle from '$lib/components/LoadingSpinnerCircle.svelte';
	import InfiniteScroll from '$lib/components/InfiniteScroll.svelte';
	import useApi from '$lib/util/api';
  
	const { httpPost, httpDelete, endPoints, statusHandler } = useApi();
  
	let currentPath;
	let keyword = '';
	let count = 10;
	let isLoading = false;
  
	onMount(() => {
	  currentPath = $page.url.pathname;
	  storePath.set(currentPath);
	});
  
	async function startCrawling() {
	  isLoading = true;
  
	  try {
		await httpPost(
		  endPoints.AUTO_CRAWLING,
		  'autoCrawlingPage',
		  { keyword, count },
		  true,
		  (res) => {
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `${keyword}_images.zip`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			sweetToast('크롤링이 완료되었습니다.', 'success');
		  },
		  (err) => {
			console.error('크롤링 중 오류 발생:', err);
			sweetToast('크롤링 중 오류가 발생했습니다.', 'error');
		  },
		  null,
		  () => {
			isLoading = false;
		  }
		);
	  } catch (error) {
		console.error('크롤링 중 오류 발생:', error);
		sweetToast('크롤링 중 오류가 발생했습니다.', 'error');
		isLoading = false;
	  }
	}
  
	async function stopCrawling() {
	  try {
		await httpDelete(
		  endPoints.AUTO_CRAWLING,
		  'autoCrawlingPage',
		  null,
		  true,
		  () => {
			sweetToast('크롤링이 중지되었습니다.', 'info');
		  },
		  (err) => {
			console.error('크롤링 중지 중 오류 발생:', err);
			sweetToast('크롤링 중지 중 오류가 발생했습니다.', 'error');
		  },
		  null,
		  () => {
			isLoading = false;
		  }
		);
	  } catch (error) {
		console.error('크롤링 중지 중 오류 발생:', error);
		sweetToast('크롤링 중지 중 오류가 발생했습니다.', 'error');
		isLoading = false;
	  }
	}
  
	function sweetToast(title, icon) {
	  showToast({ title: title, icon: icon });
	}
  
	function sweetAlert(title, text, icon, isCancel, confirmButtonText, cancelButtonText, callback) {
	  showAlert({
		title: title,
		text: text,
		icon: icon,
		isCancel: isCancel,
		confirmButtonText: confirmButtonText,
		cancelButtonText: cancelButtonText,
		callback: callback
	  });
	}
  </script>
  
  <main>
	<div class="main_top_box">
	  <img src="/imgs/icon_left.svg" alt="icon" />
	  <span>오토 크롤링</span>
	</div>
	<div class="main_box">
	  <div class="form">
		<input type="text" bind:value={keyword} placeholder="검색 키워드" />
		<input type="number" bind:value={count} placeholder="이미지 개수" />
		<button on:click={startCrawling} disabled={isLoading}>
		  {#if isLoading}
			<LoadingSpinner />
		  {:else}
			시작
		  {/if}
		</button>
		<button on:click={stopCrawling} disabled={!isLoading}>중지</button>
	  </div>
	</div>
  </main>
  
  <style>
	@media (max-width: 768px) {
	  .main_top_box {
		margin: 2rem 0;
	  }
	  .main_top_box img {
		width: 1rem;
	  }
	  .main_top_box span {
		font-size: 1.5rem;
	  }
	  .form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	  }
	  .form input,
	  .form button {
		padding: 0.5rem;
	  }
	}
  </style>