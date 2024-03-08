<!-- 능력고사 테스트 결과 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'

	const { httpPostFormData, endPoints, statusHandler } = useApi()

	let currentPath

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
	})
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>능력고사 테스트 결과 리스트</span>
	</div>

	<div class="main_box">
		<div class="table_box">
			<table>
				<th>ID</th>
				<th>테스트 이름</th>
				<th>닉네임</th>
				<th>문항 수</th>
				<th>정답 수</th>
				<th>오답 수</th>
				<th>점수</th>
				<th>메세지</th>
				<th>브라우저</th>
				<th>날짜</th>

				<tr>
					<td>1</td>
					<td>테스트1</td>
					<td>닉네임1</td>
					<td>10</td>
					<td>8</td>
					<td>2</td>
					<td>80</td>
					<td>메세지1</td>
					<td>크롬</td>
					<td>2021-10-10</td>
				</tr>
			</table>
		</div>
	</div>
</main>

<style>
	@media (max-width: 768px) {
	}
</style>
