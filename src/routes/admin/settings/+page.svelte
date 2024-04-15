<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath } from '$lib/store/store'

	let currentPath

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
	})

	function testAdd() {
		prompt('관리자 등록')
	}
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>설정</span>
	</div>
	<div class="main_box">
		<div class="admin_info">
			<div class="group_box">
				<div class="sub_box_title">
					<span>이메일</span>
					<span>닉네임</span>
					<span>휴대폰</span>
				</div>
				<div class="sub_box_content">
					<span>pointjumpit@gmail.com</span>
					<span>Hardy</span>
					<span>01077444982</span>
				</div>
			</div>
			<div class="group_box">
				<div class="sub_box_title">
					<span>생성일</span>
					<span>권한</span>
				</div>
				<div class="sub_box_content">
					<span>2024.02.01</span>
					<span>최고관리자</span>
				</div>
			</div>
		</div>

		<hr />

		<div class="admin_list">
			<button on:click={testAdd}>관리자 등록</button>
			<div class="table_box">
				<table>
					<tr>
						<th>번호</th>
						<th>이메일</th>
						<th>닉네임</th>
						<th>휴대폰</th>
						<th>생성일</th>
						<th>권한</th>
					</tr>
					<tr>
						<td>1</td>
						<td>pointjumpit@gmail.com</td>
						<td>Hardy</td>
						<td>01077444982</td>
						<td>2024.02.01</td>
						<td>최고관리자</td>
					</tr>
					<tr>
						<td>2</td>
						<td>tester@gmail.com</td>
						<td>테스트계정</td>
						<td>-</td>
						<td>2024.02.05</td>
						<td>일반관리자</td>
					</tr>
				</table>
			</div>
		</div>

		<hr />

	</div>
</main>

<style>
	.main_box {
		width: 100%;
	}
	.admin_info {
		display: flex;
		flex-direction: row;
		justify-content: center;
		width: 100%;
	}
	.group_box {
		display: flex;
		width: 50%;
	}
	.sub_box_title {
		display: flex;
		flex-direction: column;
	}
	.sub_box_title span {
		font-size: 1.5rem;
		margin: 1rem 0;
		padding: 1rem 1rem;
		color: var(--main-bg-purple);
	}
	.sub_box_content {
		display: flex;
		flex-direction: column;
		width: 50%;
	}
	.sub_box_content span {
		font-size: 1.5rem;
		margin: 1rem 0;
		padding: 1rem 1rem;
		border: 1px solid var(--secondary-color);
		border-radius: 1rem;
	}

	.admin_list {
		width: 100%;
	}

	hr {
		width: 100%;
		height: 10px;
		background-color: var(--main-bg-purple);
		margin: 5rem 0;
		border: 1px solid var(--main-bg-purple);
	}
	button {
		margin: 1rem 0;
		padding: 1rem 4.5rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-lightGray);
		color: var(--main-bg-white);
		cursor: pointer;
	}
	button:hover {
		background-color: var(--main-bg-gray);
	}
	@media (max-width: 768px) {
		button {
			padding: 0.8rem 1.2rem;
		}
		hr {
			margin: 2rem 0;
		}
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
		.group_box {
			width: 100%;
		}
		.admin_info {
			flex-direction: column;
		}
		.sub_box_title span {
			font-size: 1.2rem;
		}
		.sub_box_content span {
			font-size: 1.2rem;
		}
	}
</style>