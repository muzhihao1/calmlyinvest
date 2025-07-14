// 书签小工具 - 将以下代码保存为书签，在已登录的页面上点击即可更新持仓
// Bookmarklet - Save this as a bookmark and click it on the logged-in page to update portfolio

javascript:(async function() {
    if (typeof updatePortfolio279838958 === 'function') {
        const result = await updatePortfolio279838958();
        if (result.success) {
            alert('持仓更新成功！请刷新页面查看最新数据。\nPortfolio updated successfully! Please refresh the page.');
        } else {
            alert('更新失败：' + result.error);
        }
    } else {
        alert('请确保您已登录账号 279838958@qq.com\nPlease make sure you are logged in as 279838958@qq.com');
    }
})();