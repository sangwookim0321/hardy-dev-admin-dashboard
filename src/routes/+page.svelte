<script>

</script>

<main class="main">
    <div class="main_logo_box">
        <img src="/main-logo-128.png" alt="main-logo">
    </div>
    <div class="main_box">
        <span>Hardy Dev Admin DashBoard</span>
        <div>
            <input type="email" placeholder="Email">
            <input type="password" placeholder="Password">
            <button>LOGIN</button>
        </div>
    </div>
</main>

<style>
    .main {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: var(--main-bg-gray);
    }
    .main_logo_box {
        position: absolute;
        top: 250px;
    }
    .main_box {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        max-width: 25rem;
        height: 20rem;
        padding: 0 1rem;
        background-color: var(--main-bg-dark);
        border-radius: 1rem;
    }
    span {
        display: block;
        margin: 1rem 0;
        font-size: 1.3rem;
        text-align: center;
        color: #fff;
    }
    .main_box div {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* 인풋 사이의 간격 */
    align-items: center; /* 중앙 정렬 */
    }
    input {
    width: 80%; /* 인풋의 너비 */
    padding: 0.5rem; /* 패딩으로 인풋의 높이 조정 */
    margin: 0.5rem 0; /* 인풋 사이의 마진으로 간격 추가 */
    border: 1px solid #ccc; /* 테두리 스타일 */
    border-radius: 0.5rem; /* 테두리 둥근 처리 */
    background-color: #fff; /* 배경색 */
    font-size: 1rem; /* 폰트 사이즈 */
    }
    input:focus {
    border-color: #816BFF; /* 포커스 시 테두리 색상 변경 */
    outline: none; /* 기본 아웃라인 제거 */
    }
    button {
        width: 20%; /* 버튼의 너비 */
        padding: 0.5rem; /* 패딩으로 버튼의 높이 조정 */
        margin: 0.5rem 0; /* 버튼 사이의 마진으로 간격 추가 */
        border: none; /* 테두리 스타일 */
        border-radius: 0.5rem; /* 테두리 둥근 처리 */
        background-color: #816BFF; /* 배경색 */
        color: #fff; /* 폰트 색상 */
        font-size: 0.8rem; /* 폰트 사이즈 */
        cursor: pointer; /* 커서 스타일 변경 */
    }
    button:hover {
        background-color: #6A5ACD; /* 호버 시 배경색 변경 */
    }
</style>
