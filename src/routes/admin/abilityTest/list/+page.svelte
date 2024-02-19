<!-- 능력고사 테스트 목록 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath, storeAccessToken } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'

	const { httpGet, endPoints } = useApi()

	let currentPath
	let items = [
		{
			id: 0,
			title: '',
			sub_title: '',
			description: '',
			img_url: '',
			release: false,
			count: 0,
			created_at: ''
		}
	]

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		getItem()
	})

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	function getItem() {
		httpGet(
			endPoints.ABILITY_TEST_LIST,
			'AbilityTestList',
			true,
			(res) => {
				console.log(res.data)
			},
			(err) => {
				console.log(err)
			},
			() => {},
			() => {
				console.log('finaly')
			}
		)
	}
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>능력고사 테스트 목록</span>
	</div>
	<div class="main_box">
		<div class="group_box_01">
			<div class="group_box_01_child">
				<div>
					<span class="child_title">등록된 테스트 갯수</span>
				</div>
				<div>
					<span class="child_sub">12개</span>
				</div>
			</div>
			<div class="group_box_01_child">
				<div>
					<span class="child_title">공개/비공개</span>
				</div>
				<div>
					<span class="child_sub">10개 / 2개</span>
				</div>
			</div>
			<div class="group_box_01_child">
				<div>
					<span class="child_title">총 조회수</span>
				</div>
				<div>
					<span class="child_sub">12,232회</span>
				</div>
			</div>
		</div>
		<div class="group_box_02">
			<div class="group_box_02_child">
				<div>SUB ITEM</div>
				<div>SUB ITEM</div>
				<div>SUB ITEM</div>
			</div>
			<!-- // id, title, subtitle, release, count, created_at, 상세보기 -->
			<table>
				<th>ID</th>
				<th>테스트 이름</th>
				<th>서브 타이틀</th>
				<th>공개여부</th>
				<th>조회수</th>
				<th>생성일</th>
				<th>상세</th>

				<tr>
					<td>ID 값</td>
					<td>타이틀 값</td>
					<td>서브 타이틀 값</td>
					<td>공개여부 값</td>
					<td>조회수 값</td>
					<td>생성일 값</td>
					<td>
						<button>보기</button>
					</td>
				</tr>
			</table>
		</div>
	</div>
</main>

<style>
	.group_box_01 {
		display: flex;
		width: 100%;
		height: 200px;
	}
	.group_box_01_child {
		display: flex;
		flex-direction: column;
		width: 33.33%;
		height: 100%;
		border: 2px solid var(--main-bg-white);
		background-color: var(--main-bg-purple);
		border-radius: 10px;
	}
	.group_box_01_child div {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 50%;
	}
	.child_title {
		font-size: 2.2rem;
		color: var(--main-bg-lightGray-02);
	}
	.child_sub {
		font-size: 2.2rem;
		color: var(--main-bg-white);
	}
	.group_box_02 {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		margin-top: 100px;
	}
	.group_box_02_child {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		width: 100%;
		margin-bottom: 20px;
	}
	.group_box_02_child div {
		margin-right: 2rem;
	}
	button {
		padding: 0.5rem 1rem;
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
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
		.group_box_01 {
			height: 100px;
		}
		.child_title {
			font-size: 1.2rem;
		}
		.child_sub {
			font-size: 1.2rem;
		}
	}
</style>
