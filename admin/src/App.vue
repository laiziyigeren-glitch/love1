<template>
  <section v-if="!isAuthenticated" class="login-shell">
    <el-card class="login-card" shadow="never">
      <div class="brand login-brand">
        <div class="brand-mark">YM</div>
        <div>
          <strong>You & Me</strong>
          <span>后台管理</span>
        </div>
      </div>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="管理员邮箱">
          <el-input v-model="loginForm.email" autocomplete="username" placeholder="请输入管理员邮箱" />
        </el-form-item>
        <el-form-item label="管理员密码">
          <el-input
            v-model="loginForm.password"
            autocomplete="current-password"
            placeholder="请输入管理员密码"
            show-password
            type="password"
            @keyup.enter="submitLogin"
          />
        </el-form-item>
        <el-button class="login-button" type="primary" :loading="loginLoading" @click="submitLogin">进入后台</el-button>
      </el-form>
    </el-card>
  </section>

  <el-container v-else class="shell">
    <el-aside width="232px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">YM</div>
        <div>
          <strong>You & Me</strong>
          <span>后台管理</span>
        </div>
      </div>
      <el-menu :default-active="active" class="menu" @select="selectAdminPage">
        <el-menu-item v-for="item in adminNavItems" :key="item.index" :index="item.index">{{ item.label }}</el-menu-item>
      </el-menu>
    </el-aside>

    <el-drawer v-model="mobileMenuOpen" title="后台菜单" direction="ltr" size="280px" class="mobile-menu-drawer">
      <el-menu :default-active="active" class="mobile-menu" @select="selectAdminPage">
        <el-menu-item v-for="item in adminNavItems" :key="item.index" :index="item.index">{{ item.label }}</el-menu-item>
      </el-menu>
    </el-drawer>

    <el-container>
      <el-header class="topbar">
        <div class="topbar-title">
          <el-button class="mobile-menu-button" plain @click="mobileMenuOpen = true">菜单</el-button>
          <div>
            <h1>{{ pageTitle }}</h1>
            <p>这里保存的数据会被前台页面读取。保存后前台会自动同步，也可以手动刷新。</p>
          </div>
        </div>
        <div class="topbar-actions">
          <el-button :loading="loading" @click="load">刷新数据</el-button>
          <el-button type="primary" plain @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <el-main v-if="dashboard" class="main">
        <section v-show="active === 'dashboard'" class="panel-grid">
          <el-card v-for="item in statCards" :key="item.label" shadow="never">
            <div class="metric">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </el-card>
          <el-card class="wide" shadow="never">
            <template #header>下一纪念日</template>
            <el-result
              v-if="dashboard.nextAnniversary"
              icon="success"
              :title="dashboard.nextAnniversary.title"
              :sub-title="`${dashboard.nextAnniversary.date}，还有 ${daysUntilNext} 天`"
            />
            <el-empty v-else description="还没有可倒计时的纪念日" />
          </el-card>
        </section>

        <section v-show="active === 'home'">
          <el-card shadow="never">
            <template #header>首页内容管理</template>
            <el-form label-width="110px">
              <el-form-item label="心动指数">
                <el-input-number v-model="dashboard.site.settings.heartIndex.value" :min="0" :max="100" />
              </el-form-item>
              <el-form-item label="指数文案">
                <el-input v-model="dashboard.site.settings.heartIndex.quote" />
              </el-form-item>
              <el-form-item label="曲线标签">
                <el-input v-model="heartLabelsText" placeholder="05-26,06-02,06-09" />
              </el-form-item>
              <el-form-item label="曲线数值">
                <el-input v-model="heartValuesText" placeholder="60,50,45,35,5" />
              </el-form-item>
              <el-divider />
              <el-form-item label="About 图片">
                <div class="inline-actions">
                  <el-switch v-model="dashboard.site.settings.aboutImageVisible" active-text="显示" inactive-text="隐藏" />
                  <el-input v-model="dashboard.site.settings.aboutImageUrl" placeholder="图片地址或上传图片" />
                  <el-upload :show-file-list="false" :http-request="uploadAboutImage">
                    <el-button>上传</el-button>
                  </el-upload>
                </div>
              </el-form-item>
              <el-divider />
              <div class="card-header">
                <strong>甜蜜时刻</strong>
                <div class="inline-actions">
                  <el-button type="primary" @click="addMoment">新增</el-button>
                  <el-button type="success" :loading="homeSaving" :disabled="homeSaving" @click="saveHome">保存甜蜜时刻</el-button>
                </div>
              </div>
              <el-table class="desktop-editor-table" :data="dashboard.site.settings.moments" row-key="id">
                <el-table-column label="标题" min-width="180">
                  <template #default="{ row }"><el-input v-model="row.title" /></template>
                </el-table-column>
                <el-table-column label="日期" width="190">
                  <template #default="{ row }"><el-date-picker v-model="row.date" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removeMoment($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
              <div class="mobile-card-list">
                <article v-for="(moment, index) in dashboard.site.settings.moments" :key="moment.id || index" class="mobile-edit-card">
                  <div class="mobile-edit-card__title">甜蜜时刻 {{ index + 1 }}</div>
                  <label>标题<el-input v-model="moment.title" /></label>
                  <label>日期<el-date-picker v-model="moment.date" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></label>
                  <el-button type="danger" plain @click="removeMoment(index)">删除</el-button>
                </article>
              </div>
              <el-divider />
              <div class="card-header">
                <strong>未来约定</strong>
                <div class="inline-actions">
                  <el-button type="primary" @click="addPromise">新增</el-button>
                  <el-button type="success" :loading="homeSaving" :disabled="homeSaving" @click="saveHome">保存未来约定</el-button>
                </div>
              </div>
              <el-table class="desktop-editor-table" :data="dashboard.site.settings.promises" row-key="id">
                <el-table-column label="图标" width="100">
                  <template #default="{ row }"><el-input v-model="row.icon" /></template>
                </el-table-column>
                <el-table-column label="内容" min-width="260">
                  <template #default="{ row }"><el-input v-model="row.text" /></template>
                </el-table-column>
                <el-table-column label="完成" width="100">
                  <template #default="{ row }"><el-switch v-model="row.done" inline-prompt active-text="是" inactive-text="否" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removePromise($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
              <div class="mobile-card-list">
                <article v-for="(promise, index) in dashboard.site.settings.promises" :key="promise.id || index" class="mobile-edit-card">
                  <div class="mobile-edit-card__title">未来约定 {{ index + 1 }}</div>
                  <label>图标<el-input v-model="promise.icon" /></label>
                  <label>内容<el-input v-model="promise.text" /></label>
                  <div class="mobile-switch-row"><span>完成</span><el-switch v-model="promise.done" inline-prompt active-text="是" inactive-text="否" /></div>
                  <el-button type="danger" plain @click="removePromise(index)">删除</el-button>
                </article>
              </div>
              <el-divider />
              <el-form-item label="爱的信箱">
                <el-input v-model="dashboard.site.settings.mailbox.text" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item label="信箱署名">
                <el-input v-model="dashboard.site.settings.mailbox.author" />
              </el-form-item>
              <el-button type="primary" @click="saveHome">保存首页内容</el-button>
            </el-form>
          </el-card>
        </section>

        <section v-show="active === 'profile'">
          <el-card shadow="never">
            <template #header>空间资料</template>
            <el-form label-width="96px">
              <el-form-item label="首页标题"><el-input v-model="dashboard.site.heroTitle" /></el-form-item>
              <el-form-item label="首页副文案"><el-input v-model="dashboard.site.heroText" /></el-form-item>
              <el-form-item label="About 文案"><el-input v-model="dashboard.site.story" type="textarea" :rows="4" /></el-form-item>
              <el-divider />
              <div class="card-header">
                <strong>页面头图文配置</strong>
                <span class="form-hint">每个前台页面顶部的大标题、副文案和右侧图片都从这里同步。</span>
              </div>
              <div class="page-header-configs">
                <div v-for="item in pageHeaderKeys" :key="item.key" class="page-header-config">
                  <strong>{{ item.label }}</strong>
                  <el-input v-model="pageHeader(item.key).title" placeholder="页面标题" />
                  <el-input v-model="pageHeader(item.key).subtitle" placeholder="页面副文案" />
                  <div class="inline-actions">
                    <el-image class="tiny-preview" :src="pageHeader(item.key).imageUrl" fit="cover" />
                    <el-input v-model="pageHeader(item.key).imageUrl" placeholder="右侧图片地址或上传" />
                    <el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadPageHeaderImage(options, item.key)">
                      <el-button>上传</el-button>
                    </el-upload>
                  </div>
                </div>
              </div>
              <el-divider />
              <div v-for="profile in dashboard.profiles" :key="profile.id" class="profile-row">
                <el-avatar :size="72" :src="profile.avatarUrl" />
                <el-upload :show-file-list="false" :http-request="(options: UploadRequestOptions) => uploadAvatar(options, profile)">
                  <el-button>上传头像</el-button>
                </el-upload>
                <el-form-item label="昵称"><el-input v-model="profile.name" /></el-form-item>
                <el-form-item label="专属称呼"><el-input v-model="profile.nickname" /></el-form-item>
                <el-form-item label="说明文案"><el-input v-model="profile.bio" /></el-form-item>
                <el-form-item label="头像地址"><el-input v-model="profile.avatarUrl" /></el-form-item>
              </div>
              <el-form-item label="资料标签">
                <el-input v-model="profileCardTagsText" type="textarea" :rows="3" placeholder="每行一个标签，会同步到每个前台页面侧边资料卡" />
              </el-form-item>
              <el-button type="primary" :loading="profileSaving" :disabled="profileSaving" @click="saveProfileAndSite">保存资料</el-button>
            </el-form>
          </el-card>
        </section>

        <section v-show="active === 'anniversary'">
          <el-card shadow="never" class="section-card">
            <template #header>纪念日页面配置</template>
            <el-form label-width="110px">
              <el-form-item label="开始日期">
                <div class="inline-actions">
                  <el-date-picker v-model="dashboard.site.settings.anniversaryPage.startDate" type="datetime" value-format="YYYY-MM-DDTHH:mm" format="YYYY-MM-DD HH:mm" />
                  <el-input v-model="dashboard.site.settings.anniversaryPage.startTitle" placeholder="例如：我们的开始" />
                </div>
              </el-form-item>
              <el-form-item label="第一次见面">
                <el-date-picker v-model="dashboard.site.settings.anniversaryPage.firstMeetDate" type="datetime" value-format="YYYY-MM-DDTHH:mm" format="YYYY-MM-DD HH:mm" />
              </el-form-item>
              <el-form-item label="首页倒计时">
                <el-switch v-model="dashboard.site.settings.anniversaryPage.showCountdown" active-text="显示" inactive-text="隐藏" />
              </el-form-item>
              <el-form-item label="想对你说">
                <el-input v-model="dashboard.site.settings.anniversaryPage.note" type="textarea" :rows="4" />
              </el-form-item>
              <div class="card-header">
                <strong>重要时刻</strong>
                <el-button type="primary" @click="addImportantMoment">新增时刻</el-button>
              </div>
              <el-table class="desktop-editor-table" :data="dashboard.site.settings.anniversaryPage.importantMoments" row-key="id">
                <el-table-column label="标题" min-width="180">
                  <template #default="{ row }"><el-input v-model="row.title" /></template>
                </el-table-column>
                <el-table-column label="日期" width="180">
                  <template #default="{ row }"><el-date-picker v-model="row.date" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></template>
                </el-table-column>
                <el-table-column label="说明" min-width="260">
                  <template #default="{ row }"><el-input v-model="row.description" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removeImportantMoment($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
              <div class="mobile-card-list">
                <article v-for="(moment, index) in dashboard.site.settings.anniversaryPage.importantMoments" :key="moment.id || index" class="mobile-edit-card">
                  <div class="mobile-edit-card__title">重要时刻 {{ index + 1 }}</div>
                  <label>标题<el-input v-model="moment.title" /></label>
                  <label>日期<el-date-picker v-model="moment.date" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></label>
                  <label>说明<el-input v-model="moment.description" /></label>
                  <el-button type="danger" plain @click="removeImportantMoment(index)">删除</el-button>
                </article>
              </div>
              <div class="card-header">
                <strong>今日小语</strong>
                <el-button type="primary" @click="addDailyQuote">新增小语</el-button>
              </div>
              <el-table class="desktop-editor-table" :data="dashboard.site.settings.anniversaryPage.dailyQuotes" row-key="id">
                <el-table-column label="小语内容" min-width="280">
                  <template #default="{ row }"><el-input v-model="row.text" /></template>
                </el-table-column>
                <el-table-column label="署名" width="180">
                  <template #default="{ row }"><el-input v-model="row.author" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removeDailyQuote($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
              <div class="mobile-card-list">
                <article v-for="(quote, index) in dashboard.site.settings.anniversaryPage.dailyQuotes" :key="quote.id || index" class="mobile-edit-card">
                  <div class="mobile-edit-card__title">今日小语 {{ index + 1 }}</div>
                  <label>内容<el-input v-model="quote.text" /></label>
                  <label>署名<el-input v-model="quote.author" /></label>
                  <el-button type="danger" plain @click="removeDailyQuote(index)">删除</el-button>
                </article>
              </div>
              <el-button type="primary" class="save-row" :loading="anniversaryPageSaving" :disabled="anniversaryPageSaving" @click="saveAnniversaryPage">保存页面配置</el-button>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <template #header><div class="card-header"><span>纪念日管理</span><el-button type="primary" @click="addAnniversary">新增纪念日</el-button></div></template>
            <el-table class="desktop-editor-table" :data="dashboard.anniversaries" row-key="id">
              <el-table-column label="标题" min-width="150"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
              <el-table-column label="日期" width="180"><template #default="{ row }"><el-date-picker v-model="row.eventDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></template></el-table-column>
              <el-table-column label="每年重复" width="110"><template #default="{ row }"><el-switch v-model="row.repeatYearly" /></template></el-table-column>
              <el-table-column label="倒计时" width="100"><template #default="{ row }"><el-switch v-model="row.showCountdown" /></template></el-table-column>
              <el-table-column label="说明" min-width="220"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
              <el-table-column label="操作" width="150" fixed="right"><template #default="{ row, $index }"><el-button link type="primary" :loading="isRowBusy('anniversary', row)" :disabled="isRowBusy('anniversary', row)" @click="saveOneAnniversary(row)">保存</el-button><el-button link type="danger" :loading="isRowBusy('anniversary', row)" :disabled="isRowBusy('anniversary', row)" @click="removeAnniversary(row, $index)">删除</el-button></template></el-table-column>
            </el-table>
            <div class="mobile-card-list">
              <article v-for="(anniversary, index) in dashboard.anniversaries" :key="anniversary.id || index" class="mobile-edit-card">
                <div class="mobile-edit-card__title">{{ anniversary.title || `纪念日 ${index + 1}` }}</div>
                <label>标题<el-input v-model="anniversary.title" /></label>
                <label>日期<el-date-picker v-model="anniversary.eventDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" /></label>
                <div class="mobile-switch-row"><span>每年重复</span><el-switch v-model="anniversary.repeatYearly" /></div>
                <div class="mobile-switch-row"><span>倒计时</span><el-switch v-model="anniversary.showCountdown" /></div>
                <label>说明<el-input v-model="anniversary.description" /></label>
                <div class="mobile-card-actions">
                  <el-button type="primary" :loading="isRowBusy('anniversary', anniversary)" :disabled="isRowBusy('anniversary', anniversary)" @click="saveOneAnniversary(anniversary)">保存</el-button>
                  <el-button type="danger" plain :loading="isRowBusy('anniversary', anniversary)" :disabled="isRowBusy('anniversary', anniversary)" @click="removeAnniversary(anniversary, index)">删除</el-button>
                </div>
              </article>
            </div>
          </el-card>
        </section>

        <section v-show="active === 'album'">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>相册管理</span>
                <div class="upload-actions">
                  <el-input v-model="uploadMeta.title" placeholder="标题" />
                  <el-select v-model="uploadMeta.albumTitle" filterable allow-create default-first-option placeholder="分类标签">
                    <el-option v-for="album in albumCategories" :key="album" :label="album" :value="album" />
                  </el-select>
                  <el-input v-model="uploadMeta.location" placeholder="地点" />
                  <el-date-picker v-model="uploadMeta.takenAt" type="date" value-format="YYYY-MM-DD" placeholder="时间标签" />
                  <el-input v-model="uploadMeta.tags" placeholder="自定义标签，逗号分隔" />
                  <el-select v-model="uploadMeta.visibility" placeholder="公开状态">
                    <el-option label="公开相册" value="PUBLIC" />
                    <el-option label="私密相册" value="PRIVATE" />
                  </el-select>
                  <el-upload :show-file-list="false" accept="image/*,video/*" :http-request="uploadMedia"><el-button type="primary">上传图片/视频</el-button></el-upload>
                </div>
              </div>
            </template>
            <div class="album-grid">
              <article v-for="item in dashboard.albumItems" :key="item.id" class="album-card">
                <video v-if="item.mediaType === 'VIDEO'" :src="item.url" muted controls />
                <img v-else :src="item.thumbnailUrl || item.url" :alt="item.title" />
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.album }} / {{ item.location || '未填写地点' }} / {{ item.takenAt || '未选时间' }}</span>
                  <span v-if="item.tags.length">{{ item.tags.join('、') }}</span>
                  <span>{{ item.visibility === 'PRIVATE' ? '私密' : '公开' }} / {{ item.favorite ? '已收藏' : '未收藏' }}</span>
                  <el-button link type="primary" :disabled="isRowBusy('album', item)" @click="openAlbumEditor(item)">编辑</el-button>
                  <el-button link type="danger" :loading="isRowBusy('album', item)" :disabled="isRowBusy('album', item)" @click="removeAlbumItem(item)">删除</el-button>
                </div>
              </article>
            </div>
          </el-card>
          <el-dialog v-model="albumEditor.visible" title="编辑媒体信息" width="520px">
            <el-form label-width="90px">
              <el-form-item label="标题"><el-input v-model="albumEditor.form.title" /></el-form-item>
              <el-form-item label="分类">
                <el-select v-model="albumEditor.form.albumTitle" filterable allow-create default-first-option>
                  <el-option v-for="album in albumCategories" :key="album" :label="album" :value="album" />
                </el-select>
              </el-form-item>
              <el-form-item label="地点"><el-input v-model="albumEditor.form.location" /></el-form-item>
              <el-form-item label="时间"><el-date-picker v-model="albumEditor.form.takenAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
              <el-form-item label="标签"><el-input v-model="albumEditor.form.tagsText" placeholder="多个标签用逗号分隔" /></el-form-item>
              <el-form-item label="公开状态">
                <el-select v-model="albumEditor.form.visibility">
                  <el-option label="公开相册" value="PUBLIC" />
                  <el-option label="私密相册" value="PRIVATE" />
                </el-select>
              </el-form-item>
              <el-form-item label="收藏"><el-switch v-model="albumEditor.form.favorite" /></el-form-item>
            </el-form>
            <template #footer>
              <el-button :disabled="albumEditor.saving" @click="albumEditor.visible = false">取消</el-button>
              <el-button type="primary" :loading="albumEditor.saving" :disabled="albumEditor.saving" @click="saveAlbumEditor">保存</el-button>
            </template>
          </el-dialog>
        </section>

        <section v-show="active === 'letter'">
          <el-card shadow="never">
            <template #header><div class="card-header"><span>情书管理</span><el-button type="primary" @click="addLetter">新增情书</el-button></div></template>
            <el-collapse>
              <el-collapse-item v-for="(letter, index) in dashboard.letters" :key="letter.id || index" :title="letter.title || '未命名情书'">
                <el-form label-width="72px">
                  <el-form-item label="标题"><el-input v-model="letter.title" /></el-form-item>
                  <el-form-item label="内容"><el-input v-model="letter.body" type="textarea" :rows="6" /></el-form-item>
                  <div class="inline-actions">
                    <el-input v-model="letter.signature" placeholder="署名" />
                    <el-date-picker v-model="letter.letterDate" type="datetime" value-format="YYYY-MM-DDTHH:mm" format="YYYY-MM-DD HH:mm" />
                    <el-select v-model="letter.status">
                      <el-option label="发布" value="PUBLISHED" />
                      <el-option label="草稿" value="DRAFT" />
                      <el-option label="隐藏" value="HIDDEN" />
                    </el-select>
                    <el-date-picker
                      v-if="letter.status === 'HIDDEN'"
                      v-model="letter.visibleAt"
                      type="datetime"
                      value-format="YYYY-MM-DDTHH:mm"
                      format="YYYY-MM-DD HH:mm"
                      placeholder="到这个时间自动公开"
                    />
                    <el-button type="primary" :loading="isRowBusy('letter', letter)" :disabled="isRowBusy('letter', letter)" @click="saveOneLetter(letter)">保存</el-button>
                    <el-button type="danger" :loading="isRowBusy('letter', letter)" :disabled="isRowBusy('letter', letter)" @click="removeLetter(letter, index)">删除</el-button>
                  </div>
                </el-form>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </section>

        <section v-show="active === 'music'">
          <el-card shadow="never" class="section-card">
            <template #header>播放器设置</template>
            <el-form label-width="110px" class="theme-form">
              <el-form-item label="背景音乐">
                <el-select v-model="dashboard.site.settings.music.bgmSongId" clearable filterable placeholder="选择前台默认 BGM">
                  <el-option v-for="song in dashboard.songs" :key="song.id" :label="`${song.title} - ${song.artist || '未填歌手'}`" :value="song.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="音量"><el-slider v-model="dashboard.site.settings.music.volume" :min="0" :max="100" /></el-form-item>
              <el-form-item label="自动播放"><el-switch v-model="dashboard.site.settings.music.autoplay" /></el-form-item>
              <el-button type="primary" @click="saveMusicSettings">保存播放器设置</el-button>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <template #header><div class="card-header"><span>音乐管理</span><el-button type="primary" @click="addSong">新增歌曲</el-button></div></template>
            <el-table :data="dashboard.songs" row-key="id">
              <el-table-column label="歌名" min-width="160"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
              <el-table-column label="歌手" min-width="140"><template #default="{ row }"><el-input v-model="row.artist" /></template></el-table-column>
              <el-table-column label="时长" width="130"><template #default="{ row }"><el-input :model-value="formatDurationInput(row.duration)" placeholder="04:25" @update:model-value="(value: string) => row.duration = parseDurationInput(value)" /></template></el-table-column>
              <el-table-column label="封面地址" min-width="220"><template #default="{ row }"><el-input v-model="row.coverUrl" /></template></el-table-column>
              <el-table-column label="MP3 地址" min-width="260"><template #default="{ row }"><el-input v-model="row.audioUrl" placeholder="上传 MP3 后自动填入" /></template></el-table-column>
              <el-table-column label="上传" width="250">
                <template #default="{ row }">
                  <div class="song-upload-actions">
                    <el-upload :show-file-list="false" accept="audio/mpeg,audio/mp3,.mp3" :http-request="(options: UploadRequestOptions) => uploadSongAudio(options, row)"><el-button size="small">上传MP3</el-button></el-upload>
                    <el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadSongCover(options, row)"><el-button size="small">封面</el-button></el-upload>
                    <el-upload :show-file-list="false" accept=".lrc,.txt,text/plain" :http-request="(options: UploadRequestOptions) => uploadSongLyricsFile(options, row)"><el-button size="small">歌词</el-button></el-upload>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="歌词状态" width="220">
                <template #default="{ row }">
                  <div class="lyric-status-cell">
                    <strong>{{ row.lyric ? '已导入歌词' : '未导入歌词' }}</strong>
                    <span>{{ formatLyricStatus(row.lyric) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="收藏" width="90"><template #default="{ row }"><el-switch v-model="row.favorite" /></template></el-table-column>
              <el-table-column label="操作" width="150" fixed="right"><template #default="{ row, $index }"><el-button link type="primary" :loading="isRowBusy('song', row)" :disabled="isRowBusy('song', row)" @click="saveOneSong(row)">保存</el-button><el-button link type="danger" :loading="isRowBusy('song', row)" :disabled="isRowBusy('song', row)" @click="removeSong(row, $index)">删除</el-button></template></el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never" class="section-card">
            <template #header><div class="card-header"><span>心情歌单</span><el-button type="primary" @click="addMoodPlaylist">新增歌单</el-button></div></template>
            <el-table :data="dashboard.site.settings.music.moodPlaylists" row-key="id">
              <el-table-column label="歌单名" min-width="160"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
              <el-table-column label="描述" min-width="220"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
              <el-table-column label="封面地址" min-width="260">
                <template #default="{ row }">
                  <div class="song-upload-actions">
                    <el-input v-model="row.coverUrl" />
                    <el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadMoodPlaylistCover(options, row)">
                      <el-button size="small" :loading="isRowBusy('playlist', row)" :disabled="isRowBusy('playlist', row)">上传</el-button>
                    </el-upload>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="歌曲" min-width="320">
                <template #default="{ row }">
                  <el-select v-model="row.songIds" multiple filterable placeholder="选择歌曲">
                    <el-option v-for="song in dashboard.songs" :key="song.id || song.title" :label="`${song.title} - ${song.artist || '未填歌手'}`" :value="song.id" :disabled="!song.id" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140"><template #default="{ row, $index }"><el-button link type="primary" :loading="isRowBusy('playlist', row)" :disabled="isRowBusy('playlist', row)" @click="saveMoodPlaylist(row)">保存</el-button><el-button link type="danger" :loading="isRowBusy('playlist', row)" :disabled="isRowBusy('playlist', row)" @click="removeMoodPlaylist(row, $index)">删除</el-button></template></el-table-column>
            </el-table>
          </el-card>
        </section>

        <section v-show="active === 'romance'">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="card-header">
                <span>心动花园管理</span>
                <div class="inline-actions">
                  <el-button type="primary" @click="addHeartGardenProject">新增项目</el-button>
                  <el-button type="success" @click="saveHeartGarden">保存心动花园</el-button>
                </div>
              </div>
            </template>
            <el-alert
              class="section-tip"
              type="info"
              show-icon
              :closable="false"
              title="心动花园目前只展示 HTML：可以上传单文件 HTML，或把整套 HTML 项目放进爱心代码合集后填写 /heart-garden/... 地址；也可以从站内素材生成图片、视频、音乐引用代码。"
            />
            <el-table :data="dashboard.site.settings.heartGarden.projects" row-key="id" class="garden-table">
              <el-table-column label="预览" width="92">
                <template #default="{ row }">
                  <div class="garden-preview">
                    <el-image v-if="row.cover" :src="row.cover" fit="cover" />
                    <span v-else>{{ row.icon || '🌹' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="基础信息" min-width="270">
                <template #default="{ row }">
                  <div class="garden-form-stack">
                    <el-input v-model="row.title" placeholder="标题" />
                    <el-input v-model="row.description" type="textarea" :rows="2" placeholder="一句话描述" />
                    <div class="inline-actions compact">
                      <el-input v-model="row.icon" placeholder="图标" />
                      <el-input v-model="row.tag" placeholder="标签" />
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="分类" width="250">
                <template #default="{ row }">
                  <div class="garden-form-stack">
                    <el-select v-model="row.type" placeholder="类型">
                      <el-option label="HTML" value="html" />
                    </el-select>
                    <el-select v-model="row.group" placeholder="分组">
                      <el-option label="粒子爱心" value="particle" />
                      <el-option label="告白页面" value="confession" />
                      <el-option label="自定义" value="custom" />
                    </el-select>
                    <el-select v-model="row.status" placeholder="状态">
                      <el-option label="可预览" value="ready" />
                      <el-option label="待上传HTML" value="pending" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="打开方式" min-width="300">
                <template #default="{ row }">
                  <div class="garden-form-stack">
                    <el-input v-model="row.url" placeholder="/heart-garden/xxx/index.html 或外部地址" />
                    <div class="inline-actions compact">
                      <el-upload :show-file-list="false" accept=".html,.htm,text/html" :http-request="(options: UploadRequestOptions) => uploadHeartGardenHtml(options, row)">
                        <el-button size="small" :loading="isRowBusy('heartGarden', row)" :disabled="isRowBusy('heartGarden', row)">上传HTML</el-button>
                      </el-upload>
                      <el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadHeartGardenCover(options, row)">
                        <el-button size="small" :loading="isRowBusy('heartGarden', row)" :disabled="isRowBusy('heartGarden', row)">封面</el-button>
                      </el-upload>
                      <el-button size="small" type="primary" plain :disabled="isRowBusy('heartGarden', row)" @click="openHeartGardenAssetPicker(row)">站内素材</el-button>
                      <el-button size="small" type="success" plain :disabled="isRowBusy('heartGarden', row)" @click="openHeartGardenCodeEditor(row)">代码编辑</el-button>
                      <el-tag v-if="row.content" type="success">已上传HTML</el-tag>
                    </div>
                    <div v-if="row.linkedAssets?.length" class="linked-assets">
                      <el-tag v-for="asset in row.linkedAssets" :key="asset.id" closable size="small" @close="removeHeartGardenLinkedAsset(row, asset.id)">
                        {{ asset.title }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row, $index }">
                  <el-button link type="primary" :disabled="isRowBusy('heartGarden', row)" @click="moveHeartGardenProject($index, -1)">上移</el-button>
                  <el-button link type="primary" :disabled="isRowBusy('heartGarden', row)" @click="moveHeartGardenProject($index, 1)">下移</el-button>
                  <el-button link type="primary" :loading="isRowBusy('heartGarden', row)" :disabled="isRowBusy('heartGarden', row)" @click="saveHeartGardenProject(row)">保存</el-button>
                  <el-button link type="danger" :loading="isRowBusy('heartGarden', row)" :disabled="isRowBusy('heartGarden', row)" @click="removeHeartGardenProject(row, $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="save-row">
              <el-button type="primary" @click="saveHeartGarden">保存心动花园</el-button>
            </div>
          </el-card>
          <el-dialog v-model="assetPicker.visible" title="选择站内素材" width="820px">
            <el-alert
              class="section-tip"
              type="info"
              show-icon
              :closable="false"
              title="选择素材后会生成 HTML 片段并记录到当前心动花园项目。复制后粘进你的 HTML 代码里即可。"
            />
            <el-tabs v-model="assetPicker.activeTab">
              <el-tab-pane label="相册图片" name="images">
                <div v-if="heartGardenImageAssets.length" class="asset-picker-grid">
                  <article v-for="asset in heartGardenImageAssets" :key="asset.id" class="asset-card" @click="selectHeartGardenAsset(asset)">
                    <img :src="asset.thumbUrl || asset.url" :alt="asset.title" />
                    <strong>{{ asset.title }}</strong>
                    <span>{{ asset.subtitle }}</span>
                  </article>
                </div>
                <el-empty v-else description="相册里还没有可引用的图片" />
              </el-tab-pane>
              <el-tab-pane label="相册视频" name="videos">
                <div v-if="heartGardenVideoAssets.length" class="asset-picker-grid">
                  <article v-for="asset in heartGardenVideoAssets" :key="asset.id" class="asset-card" @click="selectHeartGardenAsset(asset)">
                    <img v-if="asset.thumbUrl" :src="asset.thumbUrl" :alt="asset.title" />
                    <div v-else class="asset-placeholder">VIDEO</div>
                    <strong>{{ asset.title }}</strong>
                    <span>{{ asset.subtitle }}</span>
                  </article>
                </div>
                <el-empty v-else description="相册里还没有可引用的视频" />
              </el-tab-pane>
              <el-tab-pane label="音乐歌曲" name="songs">
                <div v-if="heartGardenSongAssets.length" class="asset-picker-grid">
                  <article v-for="asset in heartGardenSongAssets" :key="asset.id" class="asset-card" @click="selectHeartGardenAsset(asset)">
                    <img v-if="asset.thumbUrl" :src="asset.thumbUrl" :alt="asset.title" />
                    <div v-else class="asset-placeholder">MUSIC</div>
                    <strong>{{ asset.title }}</strong>
                    <span>{{ asset.subtitle }}</span>
                  </article>
                </div>
                <el-empty v-else description="音乐页还没有可引用的歌曲" />
              </el-tab-pane>
            </el-tabs>
            <div class="snippet-box">
              <div class="card-header">
                <strong>{{ assetPicker.selectedTitle ? `生成的 HTML 片段：${assetPicker.selectedTitle}` : '生成的 HTML 片段' }}</strong>
                <el-button size="small" type="primary" :disabled="!assetPicker.snippet" @click="copyHeartGardenSnippet">复制代码</el-button>
              </div>
              <el-input v-model="assetPicker.snippet" type="textarea" :rows="5" readonly placeholder="点选上方素材后，这里会生成可粘贴的 HTML 代码。" />
            </div>
            <template #footer>
              <el-button @click="assetPicker.visible = false">关闭</el-button>
              <el-button type="success" :disabled="!assetPicker.snippet" @click="copyHeartGardenSnippet">复制代码</el-button>
            </template>
          </el-dialog>
          <el-dialog v-model="codeEditor.visible" title="心动花园代码编辑区" width="980px" class="code-editor-dialog">
            <el-alert
              class="section-tip"
              type="info"
              show-icon
              :closable="false"
              title="一个心动花园项目就是一个小文件夹。HTML/CSS/JS 可以直接编辑，图片、视频、音乐等素材上传后会生成 URL，可复制到代码里引用。"
            />
            <div class="code-editor-layout">
              <aside class="code-file-panel">
                <div class="card-header">
                  <strong>项目文件</strong>
                  <el-tag size="small">{{ codeEditor.project?.title || '未选择' }}</el-tag>
                </div>
                <el-select v-model="codeEditor.entryFile" placeholder="入口文件" class="code-entry-select">
                  <el-option
                    v-for="file in codeEditorTextFiles"
                    :key="file.id"
                    :label="file.path"
                    :value="file.path"
                    :disabled="file.type !== 'html'"
                  />
                </el-select>
                <div class="code-file-list">
                  <button
                    v-for="file in codeEditorFiles"
                    :key="file.id"
                    type="button"
                    class="code-file-item"
                    :class="{ active: file.id === codeEditor.activeFileId }"
                    @click="selectHeartGardenFile(file.id)"
                  >
                    <span>{{ file.path }}</span>
                    <small>{{ file.type }}</small>
                  </button>
                </div>
                <div class="code-new-file">
                  <el-input v-model="codeEditor.newFilePath" size="small" placeholder="例如 index.html / style.css" />
                  <el-button size="small" type="primary" @click="addHeartGardenFile">新建文件</el-button>
                </div>
                <el-upload :show-file-list="false" :http-request="uploadHeartGardenProjectAsset">
                  <el-button class="code-upload-button" size="small">上传项目素材</el-button>
                </el-upload>
                <input ref="heartGardenFolderInputRef" class="visually-hidden-file" type="file" multiple webkitdirectory @change="uploadHeartGardenFolder" />
                <el-button class="code-upload-button" size="small" type="success" plain @click="triggerHeartGardenFolderPicker">上传文件夹</el-button>
              </aside>
              <main class="code-file-editor">
                <template v-if="codeEditorCurrentFile">
                  <div class="card-header">
                    <strong>{{ codeEditorCurrentFile.path }}</strong>
                    <div class="inline-actions compact">
                      <el-button v-if="codeEditorCurrentFile.url" size="small" @click="copyTextValue(codeEditorCurrentFile.url)">复制 URL</el-button>
                      <el-button size="small" type="danger" plain @click="removeHeartGardenFile(codeEditorCurrentFile.id)">删除文件</el-button>
                    </div>
                  </div>
                  <el-input
                    v-if="codeEditorCurrentFile.content !== undefined"
                    v-model="codeEditorCurrentFile.content"
                    type="textarea"
                    :rows="18"
                    resize="vertical"
                    placeholder="在这里写 HTML / CSS / JS"
                  />
                  <div v-else class="asset-file-detail">
                    <div class="asset-placeholder">{{ codeEditorCurrentFile.type.toUpperCase() }}</div>
                    <el-input :model-value="codeEditorCurrentFile.url" readonly />
                    <p>这个素材已经上传到 R2。复制 URL 后，可以在 HTML 里用 img、video 或 audio 引用它。</p>
                  </div>
                </template>
                <el-empty v-else description="请选择或新建一个文件" />
              </main>
            </div>
            <template #footer>
              <el-button @click="codeEditor.visible = false">关闭</el-button>
              <el-button type="primary" @click="saveHeartGardenCodeProject">保存并生成预览</el-button>
            </template>
          </el-dialog>
        </section>

        <section v-show="active === 'theme'">
          <el-card shadow="never">
            <template #header>主题配置</template>
            <el-form label-width="110px" class="theme-form">
              <el-form-item label="主色">
                <el-color-picker v-model="dashboard.theme.primaryColor" color-format="hex" />
                <span class="form-hint">按钮、开关、选中导航、进度条、边框高亮</span>
              </el-form-item>
              <el-form-item label="强调色">
                <el-color-picker v-model="dashboard.theme.accentColor" color-format="hex" />
                <span class="form-hint">渐变点缀、暖色标记、部分小球效果</span>
              </el-form-item>
              <el-form-item label="背景图">
                <div class="inline-actions">
                  <el-input v-model="dashboard.theme.backgroundUrl" />
                  <el-upload :show-file-list="false" accept="image/*" :http-request="uploadThemeBackground">
                    <el-button>上传背景</el-button>
                  </el-upload>
                </div>
              </el-form-item>
              <el-form-item label="背景模糊"><el-slider v-model="dashboard.theme.effects.blur" /></el-form-item>
              <el-form-item label="界面亮度"><el-slider v-model="dashboard.theme.effects.brightness" /></el-form-item>
              <el-form-item label="特效">
                <el-checkbox v-model="dashboard.theme.effects.particles">粒子</el-checkbox>
                <el-checkbox v-model="dashboard.theme.effects.petals">花瓣</el-checkbox>
                <el-checkbox v-model="dashboard.theme.effects.glass">玻璃质感</el-checkbox>
              </el-form-item>
              <el-button type="primary" @click="saveThemeConfig">保存主题</el-button>
            </el-form>
          </el-card>
        </section>

        <section v-show="active === 'privacy'">
          <el-card shadow="never">
            <template #header>隐私与提醒</template>
            <el-form label-width="110px" class="theme-form">
              <el-divider content-position="left">前台登录页文案</el-divider>
              <el-form-item label="顶部符号">
                <el-input v-model="dashboard.site.settings.coupleEntrance.mark" maxlength="6" placeholder="♡" />
              </el-form-item>
              <el-form-item label="图案图片">
                <div class="inline-actions">
                  <el-image
                    v-if="dashboard.site.settings.coupleEntrance.imageUrl"
                    class="entrance-preview"
                    :src="dashboard.site.settings.coupleEntrance.imageUrl"
                    fit="cover"
                  />
                  <el-input v-model="dashboard.site.settings.coupleEntrance.imageUrl" placeholder="图片地址或上传图片" />
                  <el-upload :show-file-list="false" accept="image/*" :http-request="uploadCoupleEntranceImage">
                    <el-button>上传</el-button>
                  </el-upload>
                  <el-button v-if="dashboard.site.settings.coupleEntrance.imageUrl" link type="danger" @click="dashboard.site.settings.coupleEntrance.imageUrl = ''">清除</el-button>
                </div>
              </el-form-item>
              <el-form-item label="标题">
                <el-input v-model="dashboard.site.settings.coupleEntrance.title" placeholder="情侣入口" />
              </el-form-item>
              <el-form-item label="说明文字">
                <el-input v-model="dashboard.site.settings.coupleEntrance.subtitle" type="textarea" :rows="2" placeholder="输入只属于你们的暗号，进入这座温柔收藏的小世界。" />
              </el-form-item>
              <el-form-item label="账号标签">
                <el-input v-model="dashboard.site.settings.coupleEntrance.nameLabel" placeholder="浪漫账号" />
              </el-form-item>
              <el-form-item label="账号提示">
                <el-input v-model="dashboard.site.settings.coupleEntrance.namePlaceholder" placeholder="love" />
              </el-form-item>
              <el-form-item label="密码标签">
                <el-input v-model="dashboard.site.settings.coupleEntrance.passwordLabel" placeholder="秘密暗号" />
              </el-form-item>
              <el-form-item label="密码提示">
                <el-input v-model="dashboard.site.settings.coupleEntrance.passwordPlaceholder" placeholder="输入你们的密码" />
              </el-form-item>
              <el-form-item label="按钮文字">
                <el-input v-model="dashboard.site.settings.coupleEntrance.submitText" placeholder="进入我们的世界" />
              </el-form-item>
              <el-divider content-position="left">前台登录账号</el-divider>
              <el-alert
                show-icon
                :closable="false"
                type="info"
                title="这里修改的是前台上传用的真实登录账号。密码留空保存时不会修改旧密码。"
              />
              <el-form-item label="登录账号">
                <el-input v-model="coupleAccessForm.name" placeholder="love" autocomplete="off" />
              </el-form-item>
              <el-form-item label="登录密码">
                <el-input
                  v-model="coupleAccessForm.password"
                  placeholder="留空则不修改当前密码"
                  show-password
                  type="password"
                  autocomplete="new-password"
                />
                <span class="form-hint">{{ coupleAccessForm.passwordSet ? '当前已设置后台自定义密码。' : '当前仍使用 Render 环境变量里的密码。' }}</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" plain @click="saveCoupleAccessSettings">保存前台登录账号</el-button>
              </el-form-item>
              <el-divider content-position="left">相册与提醒</el-divider>
              <el-form-item label="私密相册">
                <el-switch v-model="dashboard.site.settings.privacy.privateAlbum" active-text="显示私密相册入口" inactive-text="不显示" />
              </el-form-item>
              <el-form-item label="纪念日提醒">
                <el-switch v-model="dashboard.site.settings.reminders.anniversaryEnabled" />
                <span class="form-hint">前台站内提醒</span>
              </el-form-item>
              <el-form-item label="提前天数">
                <el-input-number v-model="dashboard.site.settings.reminders.anniversaryDays" :min="0" :max="30" />
              </el-form-item>
              <el-form-item label="惊喜提醒"><el-switch v-model="dashboard.site.settings.reminders.surpriseEnabled" /></el-form-item>
              <el-form-item label="每日一句">
                <el-switch v-model="dashboard.site.settings.reminders.dailyQuoteEnabled" />
                <el-time-picker v-model="dashboard.site.settings.reminders.dailyQuoteTime" value-format="HH:mm" format="HH:mm" placeholder="提醒时间" />
              </el-form-item>
              <el-button type="primary" @click="savePrivacyAndReminders">保存隐私与提醒</el-button>
            </el-form>
          </el-card>
        </section>

        <section v-show="active === 'ai'">
          <el-card shadow="never">
            <template #header>AI 小助手</template>
            <el-form label-width="130px" class="theme-form">
              <el-alert
                show-icon
                :closable="false"
                type="info"
                title="第二阶段：AI 可以生成待确认操作，只有你们在前台确认后，才会写入纪念日、重要时刻、未来约定或情书草稿。"
              />
              <el-divider content-position="left">基础开关</el-divider>
              <el-form-item label="启用助手">
                <el-switch v-model="aiConfig.enabled" active-text="开启" inactive-text="关闭" />
              </el-form-item>
              <el-form-item label="助手名称">
                <el-input v-model="aiConfig.assistantName" placeholder="心语" />
              </el-form-item>
              <el-form-item label="开场白">
                <el-input v-model="aiConfig.openingMessage" type="textarea" :rows="3" />
              </el-form-item>

              <el-divider content-position="left">模型服务</el-divider>
              <el-form-item label="服务商">
                <el-select v-model="aiConfig.provider">
                  <el-option label="DeepSeek" value="deepseek" />
                  <el-option label="通义千问 / 百炼" value="qwen" />
                  <el-option label="OpenAI 兼容" value="openai-compatible" />
                </el-select>
              </el-form-item>
              <el-form-item label="Base URL">
                <el-input v-model="aiConfig.baseUrl" placeholder="https://api.deepseek.com" />
              </el-form-item>
              <el-form-item label="模型名称">
                <el-input v-model="aiConfig.model" placeholder="deepseek-v4-flash" />
              </el-form-item>
              <el-form-item label="API Key">
                <el-input v-model="aiApiKeyDraft" type="password" show-password placeholder="留空则不修改已保存的 Key" autocomplete="new-password" />
                <span class="form-hint">{{ aiConfig.apiKeySet ? `当前已保存：****${aiConfig.apiKeyLast4}` : '还没有保存 API Key' }}</span>
              </el-form-item>

              <el-divider content-position="left">性格与记忆</el-divider>
              <el-form-item label="性格">
                <el-radio-group v-model="aiConfig.personality">
                  <el-radio-button label="gentle">温柔</el-radio-button>
                  <el-radio-button label="lively">活泼</el-radio-button>
                  <el-radio-button label="quiet">安静</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="长期记忆">
                <el-switch v-model="aiConfig.memoryEnabled" />
              </el-form-item>
              <el-form-item label="待确认操作">
                <el-switch v-model="aiConfig.actionEnabled" />
                <span class="form-hint">开启后，前台会显示确认卡片；不确认就不会写入数据。</span>
              </el-form-item>
              <el-form-item label="允许新增纪念日">
                <el-switch v-model="aiConfig.allowCreateAnniversary" :disabled="!aiConfig.actionEnabled" />
              </el-form-item>
              <el-form-item label="允许重要时刻">
                <el-switch v-model="aiConfig.allowCreateImportantMoment" :disabled="!aiConfig.actionEnabled" />
              </el-form-item>
              <el-form-item label="允许新增约定">
                <el-switch v-model="aiConfig.allowCreatePromise" :disabled="!aiConfig.actionEnabled" />
              </el-form-item>
              <el-form-item label="允许情书草稿">
                <el-switch v-model="aiConfig.allowDraftLetter" :disabled="!aiConfig.actionEnabled" />
              </el-form-item>
              <el-form-item label="允许修改提醒">
                <el-switch v-model="aiConfig.allowUpdateReminders" :disabled="!aiConfig.actionEnabled" />
                <span class="form-hint">例如：让 AI 帮你把纪念日提醒改成提前 3 天，前台确认后才会写入。</span>
              </el-form-item>
              <el-form-item label="每日消息上限">
                <el-input-number v-model="aiConfig.dailyMessageLimit" :min="1" :max="500" />
              </el-form-item>
              <el-form-item label="补充提示词">
                <el-input v-model="aiConfig.systemPromptOverride" type="textarea" :rows="4" placeholder="可补充你希望心语遵守的说话习惯" />
              </el-form-item>

              <div class="inline-actions">
                <el-button type="primary" :loading="aiSaving" @click="saveAiSettings">保存 AI 设置</el-button>
                <el-button :loading="aiTesting" @click="testAiSettings">测试连接</el-button>
                <el-button :loading="aiRebuilding" @click="rebuildAiKnowledgeNow">重新学习网站内容</el-button>
              </div>

              <el-divider content-position="left">记忆和学习</el-divider>
              <el-form-item label="网站摘要">
                <el-input
                  :model-value="aiKnowledgeSummary || '还没有生成摘要，点击“重新学习网站内容”后会显示。'"
                  type="textarea"
                  :rows="4"
                  readonly
                />
                <span class="form-hint">{{ aiKnowledgeUpdatedAt ? `最近学习：${aiKnowledgeUpdatedAt}` : 'AI 聊天前也会自动读取最新网站内容。' }}</span>
              </el-form-item>
              <div class="inline-actions">
                <el-button :loading="aiMemoryLoading" @click="loadAiMemories">刷新记忆</el-button>
                <el-button type="danger" plain :disabled="!aiMemories.length" @click="clearAiMemoryRows">清空记忆</el-button>
              </div>
              <el-table :data="aiMemories" v-loading="aiMemoryLoading" class="section-table" empty-text="还没有长期记忆">
                <el-table-column label="类型" width="130">
                  <template #default="{ row }"><el-input v-model="row.type" /></template>
                </el-table-column>
                <el-table-column label="记忆内容" min-width="360">
                  <template #default="{ row }"><el-input v-model="row.content" type="textarea" :rows="2" /></template>
                </el-table-column>
                <el-table-column label="可信度" width="130">
                  <template #default="{ row }"><el-input-number v-model="row.confidence" :min="0" :max="1" :step="0.05" /></template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="saveAiMemoryRow(row)">保存</el-button>
                    <el-button link type="danger" @click="removeAiMemoryRow(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-divider content-position="left">待确认操作记录</el-divider>
              <div class="inline-actions">
                <el-button :loading="aiActionLoading" @click="loadAiActions">刷新操作记录</el-button>
              </div>
              <el-table :data="aiActions" v-loading="aiActionLoading" class="section-table" empty-text="还没有 AI 操作记录">
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="aiActionStatusType(row.status)">{{ aiActionStatusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="140">
                  <template #default="{ row }">{{ row.label || row.type }}</template>
                </el-table-column>
                <el-table-column label="标题" min-width="180">
                  <template #default="{ row }">{{ row.title }}</template>
                </el-table-column>
                <el-table-column label="内容" min-width="320">
                  <template #default="{ row }">
                    <pre class="ai-action-preview">{{ formatAiActionPayload(row) }}</pre>
                  </template>
                </el-table-column>
                <el-table-column label="更新时间" width="180">
                  <template #default="{ row }">{{ row.updatedAt }}</template>
                </el-table-column>
              </el-table>
            </el-form>
          </el-card>
        </section>
      </el-main>

      <el-main v-else class="main">
        <el-empty description="后端未连接或暂无数据">
          <el-button type="primary" :loading="loading" @click="load">重新加载</el-button>
        </el-empty>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus';
import {
  type Dashboard,
  type UploadPathOptions,
  type AiConfig,
  type AiMemory,
  type AiAction,
  clearAdminToken,
  clearAiMemories,
  completeMediaUpload,
  createUploadUrl,
  deleteAlbumItem,
  deleteAnniversary,
  deleteAiMemory,
  deleteLetter,
  deleteSong,
  fetchAiActions,
  fetchAiConfig,
  fetchAiKnowledge,
  fetchAiMemories,
  fetchCoupleAccess,
  fetchDashboard,
  getAdminToken,
  loginAdmin,
  saveAnniversary,
  saveAiConfig,
  saveCoupleAccess,
  saveLetter,
  saveProfiles,
  saveSite,
  saveSong,
  saveTheme,
  testAiConfig,
  rebuildAiKnowledge,
  updateAiMemory,
  updateAlbumItem,
} from './api';

const active = ref('dashboard');
const mobileMenuOpen = ref(false);
const loading = ref(false);
const loginLoading = ref(false);
const profileSaving = ref(false);
const homeSaving = ref(false);
const anniversaryPageSaving = ref(false);
type RowBusyBucket = 'album' | 'letter' | 'anniversary' | 'song' | 'playlist' | 'heartGarden';
const rowBusyState = reactive<Record<RowBusyBucket, Record<string, boolean>>>({
  album: {},
  letter: {},
  anniversary: {},
  song: {},
  playlist: {},
  heartGarden: {},
});
const isAuthenticated = ref(Boolean(getAdminToken()));
const loginForm = reactive({
  email: '',
  password: '',
});
const coupleAccessForm = reactive({
  name: 'love',
  password: '',
  passwordSet: false,
});
const dashboard = ref<Dashboard | null>(null);
const adminNavItems = [
  { index: 'dashboard', label: '仪表盘' },
  { index: 'home', label: '首页' },
  { index: 'profile', label: '资料' },
  { index: 'anniversary', label: '纪念日' },
  { index: 'album', label: '相册' },
  { index: 'letter', label: '情书' },
  { index: 'music', label: '音乐' },
  { index: 'romance', label: '心动花园' },
  { index: 'ai', label: 'AI 小助手' },
  { index: 'theme', label: '主题' },
  { index: 'privacy', label: '隐私提醒' },
];
const pageHeaderKeys = [
  { key: 'home', label: '首页' },
  { key: 'anniversary', label: '纪念日' },
  { key: 'album', label: '相册' },
  { key: 'music', label: '音乐' },
  { key: 'romance', label: '心动花园' },
  { key: 'settings', label: '设置页' },
] as const;
type PageHeaderKey = (typeof pageHeaderKeys)[number]['key'];
type HeartGardenProject = Dashboard['site']['settings']['heartGarden']['projects'][number];
type HeartGardenAsset = {
  id: string;
  sourceType: 'album' | 'video' | 'song';
  sourceId: string;
  title: string;
  subtitle: string;
  url: string;
  thumbUrl: string;
  snippetType: 'image' | 'video' | 'audio';
};
type HeartGardenFile = NonNullable<HeartGardenProject['files']>[number];

function getRowBusyKey(bucket: RowBusyBucket, item: unknown) {
  const target = item as { id?: string; __rowBusyKey?: string };
  if (!target.__rowBusyKey) {
    target.__rowBusyKey = `${bucket}-${target.id || 'draft'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  return target.__rowBusyKey;
}

function isRowBusy(bucket: RowBusyBucket, item: unknown) {
  return Boolean(rowBusyState[bucket][getRowBusyKey(bucket, item)]);
}

async function withRowBusy<T>(bucket: RowBusyBucket, item: unknown, task: () => Promise<T>) {
  const key = getRowBusyKey(bucket, item);
  if (rowBusyState[bucket][key]) return undefined;
  rowBusyState[bucket][key] = true;
  try {
    return await task();
  } finally {
    delete rowBusyState[bucket][key];
  }
}

function isConfirmCancel(error: unknown) {
  return error === 'cancel' || error === 'close';
}

function getErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  const message = data?.message;
  if (Array.isArray(message)) return message.join('，');
  if (typeof message === 'string' && message.trim()) return message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function removeListItem<T extends { id?: string }>(items: T[] | undefined, item: T, index: number) {
  if (!items) return;
  const matchedIndex = item.id ? items.findIndex((entry) => entry.id === item.id) : -1;
  const targetIndex = matchedIndex >= 0 ? matchedIndex : index;
  if (targetIndex >= 0) items.splice(targetIndex, 1);
}

const uploadMeta = reactive({
  title: '',
  albumTitle: '默认相册',
  location: '',
  takenAt: new Date().toISOString().slice(0, 10),
  tags: '',
  visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
});
const albumEditor = reactive({
  visible: false,
  id: '',
  saving: false,
  form: {
    title: '',
    albumTitle: '',
    location: '',
    takenAt: '',
    tagsText: '',
    favorite: false,
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  },
});
const assetPicker = reactive({
  visible: false,
  activeTab: 'images' as 'images' | 'videos' | 'songs',
  project: null as HeartGardenProject | null,
  snippet: '',
  selectedTitle: '',
});
const codeEditor = reactive({
  visible: false,
  project: null as HeartGardenProject | null,
  activeFileId: '',
  entryFile: 'index.html',
  newFilePath: '',
});
const heartGardenFolderInputRef = ref<HTMLInputElement | null>(null);
const aiConfig = reactive<AiConfig>({
  enabled: false,
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
  apiKeySet: false,
  apiKeyLast4: '',
  assistantName: '心语',
  openingMessage: '我在这里，陪你们聊聊天，也帮你们把重要的小事认真记住。',
  personality: 'gentle',
  memoryEnabled: true,
  actionEnabled: false,
  allowCreateAnniversary: true,
  allowCreateImportantMoment: true,
  allowCreatePromise: true,
  allowDraftLetter: true,
  allowUpdateReminders: true,
  dailyMessageLimit: 80,
  systemPromptOverride: '',
});
const aiApiKeyDraft = ref('');
const aiSaving = ref(false);
const aiTesting = ref(false);
const aiRebuilding = ref(false);
const aiMemories = ref<AiMemory[]>([]);
const aiMemoryLoading = ref(false);
const aiActions = ref<AiAction[]>([]);
const aiActionLoading = ref(false);
const aiKnowledgeSummary = ref('');
const aiKnowledgeUpdatedAt = ref('');

const pageTitle = computed(() => ({
  dashboard: '仪表盘',
  home: '首页管理',
  profile: '资料管理',
  anniversary: '纪念日管理',
  album: '相册管理',
  letter: '情书管理',
  music: '音乐管理',
  romance: '心动花园',
  ai: 'AI 小助手',
  theme: '主题配置',
  privacy: '隐私与提醒',
}[active.value] ?? '后台管理'));

const statCards = computed(() => {
  if (!dashboard.value) return [];
  return [
    { label: '纪念日', value: dashboard.value.counts.anniversaries },
    { label: '照片', value: dashboard.value.counts.photos },
    { label: '情书', value: dashboard.value.counts.letters },
    { label: '歌曲', value: dashboard.value.counts.songs },
  ];
});

const daysUntilNext = computed(() => Math.ceil((dashboard.value?.nextAnniversary?.secondsUntil ?? 0) / 86400));

function selectAdminPage(index: string) {
  active.value = index;
  mobileMenuOpen.value = false;
}

const albumCategories = computed(() => {
  const values = new Set(['默认相册', '旅行', '日常', '约会', '夜晚']);
  dashboard.value?.albumItems.forEach((item) => values.add(item.album));
  return [...values];
});

const heartGardenImageAssets = computed<HeartGardenAsset[]>(() => (
  dashboard.value?.albumItems
    .filter((item) => item.mediaType === 'IMAGE' && item.url)
    .map((item) => ({
      id: `image-${item.id}`,
      sourceType: 'album',
      sourceId: item.id,
      title: item.title || item.album || '相册图片',
      subtitle: [item.album || '默认相册', item.takenAt].filter(Boolean).join(' / '),
      url: item.url,
      thumbUrl: item.thumbnailUrl || item.url,
      snippetType: 'image',
    })) || []
));

const heartGardenVideoAssets = computed<HeartGardenAsset[]>(() => (
  dashboard.value?.albumItems
    .filter((item) => item.mediaType === 'VIDEO' && item.url)
    .map((item) => ({
      id: `video-${item.id}`,
      sourceType: 'video',
      sourceId: item.id,
      title: item.title || item.album || '相册视频',
      subtitle: [item.album || '默认相册', item.takenAt].filter(Boolean).join(' / '),
      url: item.url,
      thumbUrl: item.thumbnailUrl || '',
      snippetType: 'video',
    })) || []
));

const heartGardenSongAssets = computed<HeartGardenAsset[]>(() => (
  dashboard.value?.songs
    .filter((item) => item.audioUrl)
    .map((item) => ({
      id: `song-${item.id || item.title}`,
      sourceType: 'song',
      sourceId: item.id || item.title,
      title: item.title || '音乐',
      subtitle: [item.artist || '未填歌手', item.duration ? formatDurationInput(item.duration) : ''].filter(Boolean).join(' / '),
      url: item.audioUrl,
      thumbUrl: item.coverUrl || '',
      snippetType: 'audio',
    })) || []
));

const codeEditorFiles = computed(() => codeEditor.project?.files || []);
const codeEditorTextFiles = computed(() => codeEditorFiles.value.filter((file) => file.content !== undefined));
const codeEditorCurrentFile = computed(() => codeEditorFiles.value.find((file) => file.id === codeEditor.activeFileId) || null);

const profileCardTagsText = computed({
  get: () => dashboard.value?.site.settings.profileCard?.tags?.join('\n') ?? '',
  set: (value: string) => {
    if (!dashboard.value) return;
    dashboard.value.site.settings.profileCard ||= { tags: [] };
    dashboard.value.site.settings.profileCard.tags = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
});

const heartLabelsText = computed({
  get: () => dashboard.value?.site.settings.heartIndex.labels.join(',') ?? '',
  set: (value: string) => {
    if (dashboard.value) dashboard.value.site.settings.heartIndex.labels = value.split(',').map((item) => item.trim()).filter(Boolean);
  },
});

const heartValuesText = computed({
  get: () => dashboard.value?.site.settings.heartIndex.values.join(',') ?? '',
  set: (value: string) => {
    if (dashboard.value) dashboard.value.site.settings.heartIndex.values = value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item));
  },
});

async function load() {
  loading.value = true;
  try {
    const [nextDashboard, coupleAccess, nextAiConfig, nextAiMemories, nextAiActions, nextAiKnowledge] = await Promise.all([
      fetchDashboard(),
      fetchCoupleAccess(),
      fetchAiConfig(),
      fetchAiMemories().catch(() => []),
      fetchAiActions().catch(() => []),
      fetchAiKnowledge().catch(() => ({ summary: '', updatedAt: '' })),
    ]);
    dashboard.value = nextDashboard;
    Object.assign(aiConfig, nextAiConfig);
    aiMemories.value = nextAiMemories;
    aiActions.value = nextAiActions;
    aiKnowledgeSummary.value = nextAiKnowledge.summary || '';
    aiKnowledgeUpdatedAt.value = nextAiKnowledge.updatedAt || '';
    aiApiKeyDraft.value = '';
    coupleAccessForm.name = coupleAccess.name || 'love';
    coupleAccessForm.password = '';
    coupleAccessForm.passwordSet = coupleAccess.passwordSet;
    dashboard.value.anniversaries ||= [];
    dashboard.value.songs ||= [];
    dashboard.value.letters ||= [];
    dashboard.value.albumItems ||= [];
    dashboard.value.profiles ||= [];
    ensurePageHeaders();
    ensureProfileCardSettings();
    ensureHomeSettings();
    ensureMusicSettings();
    ensurePrivacyReminderSettings();
    ensureCoupleEntranceSettings();
    ensureHeartGardenSettings();
    ensureAnniversaryPageSettings();
    if (isLegacyDefaultFirstMeetDate(dashboard.value.site.settings.anniversaryPage.firstMeetDate) && !findSyncedAnniversary('meet')) {
      dashboard.value.site.settings.anniversaryPage.firstMeetDate = '';
    }
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 401) {
      clearAdminToken();
      isAuthenticated.value = false;
      dashboard.value = null;
      ElMessage.error('登录已失效，请重新登录');
      return;
    }
    dashboard.value = null;
    ElMessage.error('无法连接后端，请确认 API 和 MySQL 已启动');
  } finally {
    loading.value = false;
  }
}

async function submitLogin() {
  if (!loginForm.email || !loginForm.password) {
    ElMessage.warning('请填写管理员邮箱和密码');
    return;
  }
  loginLoading.value = true;
  try {
    await loginAdmin(loginForm);
    isAuthenticated.value = true;
    loginForm.password = '';
    ElMessage.success('登录成功');
    await load();
  } catch {
    ElMessage.error('登录失败，请检查 Render 里的 ADMIN_EMAIL 和 ADMIN_PASSWORD');
  } finally {
    loginLoading.value = false;
  }
}

function logout() {
  clearAdminToken();
  isAuthenticated.value = false;
  dashboard.value = null;
  ElMessage.success('已退出后台');
}

function ensurePageHeaders() {
  if (!dashboard.value) return;
  const defaults = {
    home: {
      title: dashboard.value.site.heroTitle || '遇见你，是我最美丽的意外',
      subtitle: dashboard.value.site.heroText || '感谢命运让我们相遇，从此，你的名字就是我最温暖的诗篇。',
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=640&q=80',
    },
    anniversary: {
      title: '把每个日子，都写成我们的纪念',
      subtitle: '第一次见面、在一起、每个节日，都在这里被认真收藏。',
      imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=640&q=80',
    },
    album: {
      title: '把心动瞬间，藏进时光相册',
      subtitle: '照片和视频都来自我们的真实回忆，按时间慢慢发光。',
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=640&q=80',
    },
    music: {
      title: '把喜欢的歌，放进我们的音乐盒',
      subtitle: '每一首歌都有一个场景，也有一个想起你的理由。',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80',
    },
    romance: {
      title: '把收集来的爱心代码，变成可以随手打开的小惊喜',
      subtitle: '每次点开，都像在花园里多认领一朵会发光的小花。',
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=640&q=80',
    },
    settings: {
      title: '把这份浪漫，调成我们喜欢的样子',
      subtitle: '主题、音乐、纪念日和相册，都可以在这里慢慢定制。',
      imageUrl: 'https://images.unsplash.com/photo-1517534573028-3db0dab0d31c?auto=format&fit=crop&w=640&q=80',
    },
  };
  const legacyHeaders = (dashboard.value.site.settings.pageHeaders as Record<string, typeof defaults.home> | undefined) || {};
  dashboard.value.site.settings.pageHeaders = {
    ...defaults,
    ...legacyHeaders,
    romance: {
      ...defaults.romance,
      ...(legacyHeaders.romance || legacyHeaders.heartGarden || {}),
    },
  };
}

function pageHeader(key: PageHeaderKey) {
  const current = dashboard.value;
  if (!current) throw new Error('Dashboard is not loaded');
  if (!current.site.settings.pageHeaders?.[key]) ensurePageHeaders();
  return current.site.settings.pageHeaders[key];
}

function ensureProfileCardSettings() {
  if (!dashboard.value) return;
  dashboard.value.site.settings.profileCard = {
    ...(dashboard.value.site.settings.profileCard || {}),
    tags: dashboard.value.site.settings.profileCard?.tags || ['❤️ 我们的故事', '⭐ 彼此的唯一', '∞ 永远在一起'],
  };
  if (!dashboard.value.site.settings.profileCard.tags?.length) {
    dashboard.value.site.settings.profileCard.tags = ['❤️ 我们的故事', '⭐ 彼此的唯一', '∞ 永远在一起'];
  }
}

function ensureHomeSettings() {
  if (!dashboard.value) return;
  if (!Array.isArray(dashboard.value.site.settings.moments)) {
    dashboard.value.site.settings.moments = [];
  }
  if (!Array.isArray(dashboard.value.site.settings.promises)) {
    dashboard.value.site.settings.promises = [];
  }
  dashboard.value.site.settings.moments = dashboard.value.site.settings.moments.map((item, index) => ({
    id: item.id || `moment-${Date.now()}-${index}`,
    title: item.title || '新的甜蜜时刻',
    date: String(item.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
  }));
  const promiseIds = new Set<string>();
  dashboard.value.site.settings.promises = dashboard.value.site.settings.promises.map((item, index) => ({
    id: uniqueSettingsId(item.id, `promise-${Date.now()}-${index}`, promiseIds),
    icon: item.icon || '❤️',
    text: item.text || '新的未来约定',
    done: item.done === true,
  }));
}

function uniqueSettingsId(rawId: unknown, fallbackId: string, usedIds: Set<string>) {
  const base = String(rawId || fallbackId || 'item').trim() || 'item';
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function isLegacyDefaultFirstMeetDate(value: unknown) {
  return String(value || '').slice(0, 10) === '2024-08-14';
}

function ensureAnniversaryPageSettings() {
  if (!dashboard.value) return;
  const page = dashboard.value.site.settings.anniversaryPage;
  page.showCountdown ??= true;
  page.dailyQuotes = Array.isArray(page.dailyQuotes) ? page.dailyQuotes : [];
  page.importantMoments = Array.isArray(page.importantMoments) ? page.importantMoments.map((item, index) => ({
    id: item.id || `important-${Date.now()}-${index}`,
    title: item.title || '新的重要时刻',
    date: String(item.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: item.description || '',
  })) : [];
}

async function saveHome() {
  if (!dashboard.value || homeSaving.value) return;
  homeSaving.value = true;
  const savingMessage = ElMessage({
    message: '正在保存首页内容...',
    type: 'info',
    duration: 0,
  });
  try {
    ensureHomeSettings();
    dashboard.value.site.settings.moments = dashboard.value.site.settings.moments
      .map((item) => ({
        ...item,
        title: String(item.title || '').trim(),
        date: String(item.date || '').slice(0, 10),
      }))
      .filter((item) => item.title && item.date);
    dashboard.value.site.settings.promises = dashboard.value.site.settings.promises
      .map((item) => ({
        ...item,
        icon: String(item.icon || '').trim() || '❤️',
        text: String(item.text || '').trim(),
        done: item.done === true,
      }))
      .filter((item) => item.text);
    await saveSite(dashboard.value.site);
    ElMessage.success('首页内容已保存，前台会自动同步');
    await load();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '首页内容保存失败'));
  } finally {
    savingMessage.close();
    homeSaving.value = false;
  }
}

async function saveProfileAndSite() {
  if (!dashboard.value || profileSaving.value) return;
  profileSaving.value = true;
  const savingMessage = ElMessage({
    message: '正在保存资料...',
    type: 'info',
    duration: 0,
  });
  try {
    await Promise.all([
      saveSite(dashboard.value.site),
      saveProfiles(dashboard.value.profiles),
    ]);
    ElMessage.success('资料已保存，前台会自动同步');
  } finally {
    savingMessage.close();
    profileSaving.value = false;
  }
}

async function saveThemeConfig() {
  if (!dashboard.value) return;
  const theme = {
    ...dashboard.value.theme,
    primaryColor: normalizeHexColor(dashboard.value.theme.primaryColor, '#e8748a'),
    accentColor: normalizeHexColor(dashboard.value.theme.accentColor, '#d4956a'),
    effects: {
      particles: dashboard.value.theme.effects.particles !== false,
      petals: dashboard.value.theme.effects.petals !== false,
      glass: dashboard.value.theme.effects.glass !== false,
      blur: Number(dashboard.value.theme.effects.blur ?? 72),
      brightness: Number(dashboard.value.theme.effects.brightness ?? 68),
    },
  };
  dashboard.value.theme = await saveTheme(theme);
  ElMessage.success('主题已保存，前台会自动同步');
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const text = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  if (/^#[0-9a-f]{3}$/i.test(text)) {
    return `#${text.slice(1).split('').map((char) => `${char}${char}`).join('')}`;
  }
  return fallback;
}

async function uploadThemeBackground(options: UploadRequestOptions) {
  if (!dashboard.value) return;
  try {
    const file = await compressImageFile(options.file, { maxSize: 2200, quality: 0.88 });
    const { publicUrl: backgroundUrl } = await uploadFileToObjectStorage(file, { purpose: 'background' });
    dashboard.value.theme.backgroundUrl = backgroundUrl;
    dashboard.value.site.settings.themeCustomBackgroundUrl = backgroundUrl;
    await saveThemeConfig();
    await saveSite(dashboard.value.site);
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('背景图上传失败');
    options.onError?.(error as never);
  }
}

function addMoment() {
  dashboard.value?.site.settings.moments.push({ id: `moment-${Date.now()}`, title: '新的甜蜜时刻', date: new Date().toISOString().slice(0, 10) });
}

function removeMoment(index: number) {
  dashboard.value?.site.settings.moments.splice(index, 1);
}

function addPromise() {
  if (!dashboard.value) return;
  const usedIds = new Set(dashboard.value.site.settings.promises.map((item) => String(item.id || '').trim()).filter(Boolean));
  dashboard.value.site.settings.promises.push({
    id: uniqueSettingsId('', `promise-${Date.now()}`, usedIds),
    icon: '❤️',
    text: '新的未来约定',
    done: false,
  });
}

function removePromise(index: number) {
  dashboard.value?.site.settings.promises.splice(index, 1);
}

function addDailyQuote() {
  dashboard.value?.site.settings.anniversaryPage.dailyQuotes.push({
    id: `quote-${Date.now()}`,
    text: '新的今日小语',
    author: 'You & Me',
  });
}

function removeDailyQuote(index: number) {
  dashboard.value?.site.settings.anniversaryPage.dailyQuotes.splice(index, 1);
}

function addImportantMoment() {
  dashboard.value?.site.settings.anniversaryPage.importantMoments.push({
    id: `important-${Date.now()}`,
    title: '新的重要时刻',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });
}

function removeImportantMoment(index: number) {
  dashboard.value?.site.settings.anniversaryPage.importantMoments.splice(index, 1);
}

function toAnniversaryInputValue(value: string, fallback = '') {
  const source = String(value || fallback || '').trim();
  if (!source) return '';
  if (source.includes('T')) return source.slice(0, 16);
  return `${source.slice(0, 10)}T00:00`;
}

function getAnniversarySyncKind(item: Dashboard['anniversaries'][number]) {
  const title = item.title || '';
  if (item.id === 'anniv-first-meet' || item.type === 'meet' || title.includes('第一次见面')) return 'meet';
  if (item.id === 'anniv-together' || item.type === 'love' || title.includes('在一起') || title.includes('开始') || title.includes('确认关系')) return 'start';
  return '';
}

function findSyncedAnniversaries(kind: 'start' | 'meet') {
  const items = dashboard.value?.anniversaries || [];
  if (kind === 'start') {
    return items.filter((item) =>
      item.id === 'anniv-together'
      || item.type === 'love'
      || ['在一起', '开始', '确认关系'].some((keyword) => item.title.includes(keyword)),
    );
  }
  return items.filter((item) =>
    item.id === 'anniv-first-meet'
    || item.type === 'meet'
    || item.title.includes('第一次见面'),
  );
}

function findSyncedAnniversary(kind: 'start' | 'meet') {
  return findSyncedAnniversaries(kind)[0];
}

function mergeSavedAnniversary(saved: Dashboard['anniversaries'][number]) {
  const items = dashboard.value?.anniversaries;
  if (!items) return;
  const index = items.findIndex((item) => item.id === saved.id);
  if (index >= 0) {
    items[index] = saved;
  } else {
    items.push(saved);
  }
}

async function pruneDuplicateSyncedAnniversaries(savedItems: Dashboard['anniversaries']) {
  if (!dashboard.value?.anniversaries?.length) return;
  const keepIds = new Map(
    savedItems
      .map((item) => [getAnniversarySyncKind(item), item.id] as const)
      .filter(([kind, id]) => Boolean(kind && id)),
  );
  for (const kind of ['start', 'meet'] as const) {
    const keepId = keepIds.get(kind) || '';
    const duplicates = findSyncedAnniversaries(kind).filter((item) => item.id && item.id !== keepId);
    for (const duplicate of duplicates) {
      await deleteAnniversary(duplicate.id);
      const list = dashboard.value.anniversaries;
      const index = list.findIndex((item) => item.id === duplicate.id);
      if (index >= 0) list.splice(index, 1);
    }
  }
}

function buildAnniversaryFromPageSettings(kind: 'start' | 'meet') {
  if (!dashboard.value) return null;
  const page = dashboard.value.site.settings.anniversaryPage;
  const current = findSyncedAnniversary(kind);
  if (kind === 'start') {
    const eventDate = toAnniversaryInputValue(page.startDate, current?.eventDate);
    if (!eventDate) return null;
    return {
      id: current?.id || '',
      title: page.startTitle || current?.title || '我们的开始',
      eventDate,
      type: current?.type || 'love',
      repeatYearly: current?.repeatYearly ?? true,
      showCountdown: page.showCountdown !== false,
      description: current?.description || page.note || '',
    };
  }
  const eventDate = toAnniversaryInputValue(page.firstMeetDate);
  if (!eventDate) return null;
  return {
    id: current?.id || '',
    title: current?.title || '第一次见面',
    eventDate,
    type: current?.type || 'meet',
    repeatYearly: current?.repeatYearly ?? true,
    showCountdown: current?.showCountdown ?? false,
    description: current?.description || '',
  };
}

function syncPageSettingsFromAnniversary(item: Dashboard['anniversaries'][number]) {
  if (!dashboard.value) return false;
  const page = dashboard.value.site.settings.anniversaryPage;
  const kind = getAnniversarySyncKind(item);
  if (kind === 'start') {
    page.startDate = toAnniversaryInputValue(item.eventDate, page.startDate);
    page.startTitle = item.title || page.startTitle;
    page.showCountdown = item.showCountdown;
    return true;
  }
  if (kind === 'meet') {
    page.firstMeetDate = toAnniversaryInputValue(item.eventDate, page.firstMeetDate);
    return true;
  }
  return false;
}

function clearPageSettingsFromAnniversary(item: Dashboard['anniversaries'][number]) {
  if (!dashboard.value) return false;
  const page = dashboard.value.site.settings.anniversaryPage;
  const kind = getAnniversarySyncKind(item);
  if (kind === 'start') {
    page.startDate = '';
    page.startTitle = '';
    page.showCountdown = false;
    return true;
  }
  if (kind === 'meet') {
    page.firstMeetDate = '';
    return true;
  }
  return false;
}

function removeSongReferencesFromSettings(songId: string) {
  if (!dashboard.value || !songId) return false;
  const music = dashboard.value.site.settings.music;
  let changed = false;
  if (music.bgmSongId === songId) {
    music.bgmSongId = '';
    changed = true;
  }
  music.moodPlaylists = music.moodPlaylists.map((playlist) => {
    if (!Array.isArray(playlist.songIds) || !playlist.songIds.includes(songId)) return playlist;
    changed = true;
    return {
      ...playlist,
      songIds: playlist.songIds.filter((id) => id !== songId),
    };
  });
  return changed;
}

async function saveAnniversaryPage() {
  if (!dashboard.value || anniversaryPageSaving.value) return;
  anniversaryPageSaving.value = true;
  const savingMessage = ElMessage({
    message: '正在保存纪念日页面配置...',
    type: 'info',
    duration: 0,
  });
  try {
    const page = dashboard.value.site.settings.anniversaryPage;
    page.importantMoments = (page.importantMoments || [])
      .map((item, index) => ({
        id: item.id || `important-${Date.now()}-${index}`,
        title: String(item.title || '').trim(),
        date: String(item.date || '').slice(0, 10),
        description: String(item.description || '').trim(),
      }))
      .filter((item) => item.title && item.date);
    const shouldClearMeetAnniversary = !toAnniversaryInputValue(dashboard.value.site.settings.anniversaryPage.firstMeetDate);
    const anniversaryItems = [
      buildAnniversaryFromPageSettings('start'),
      buildAnniversaryFromPageSettings('meet'),
    ].filter(Boolean) as Dashboard['anniversaries'];
    const [, ...savedAnniversaries] = await Promise.all([
      saveSite(dashboard.value.site),
      ...anniversaryItems.map((item) => saveAnniversary(item)),
    ]);
    savedAnniversaries.forEach((item) => mergeSavedAnniversary(item));
    await pruneDuplicateSyncedAnniversaries(savedAnniversaries);
    if (shouldClearMeetAnniversary) {
      for (const item of findSyncedAnniversaries('meet')) {
        if (!item.id) continue;
        await deleteAnniversary(item.id);
      }
    }
    ElMessage.success('纪念日页面配置已保存，前台会自动同步');
    await load();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '纪念日页面配置保存失败'));
  } finally {
    savingMessage.close();
    anniversaryPageSaving.value = false;
  }
}

async function uploadAboutImage(options: UploadRequestOptions) {
  if (!dashboard.value) return;
  try {
    const file = await compressImageFile(options.file, { maxSize: 1600, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'about' });
    dashboard.value.site.settings.aboutImageUrl = publicUrl;
    dashboard.value.site.settings.aboutImageVisible = true;
    await saveHome();
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('About 图片上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadCoupleEntranceImage(options: UploadRequestOptions) {
  if (!dashboard.value) return;
  try {
    const file = await compressImageFile(options.file, { maxSize: 640, quality: 0.88 });
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'login' });
    dashboard.value.site.settings.coupleEntrance.imageUrl = publicUrl;
    ElMessage.success('登录页图案已上传，记得保存隐私与提醒');
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('登录页图案上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadPageHeaderImage(options: UploadRequestOptions, pageKey: PageHeaderKey) {
  if (!dashboard.value) return;
  try {
    ensurePageHeaders();
    const file = await compressImageFile(options.file, { maxSize: 2200, quality: 0.88 });
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'page-header', folder: pageKey });
    dashboard.value.site.settings.pageHeaders[pageKey].imageUrl = publicUrl;
    await saveProfileAndSite();
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('页面头图上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

function addAnniversary() {
  dashboard.value?.anniversaries.push({
    id: '',
    title: '新的纪念日',
    eventDate: new Date().toISOString().slice(0, 10),
    type: 'custom',
    repeatYearly: true,
    showCountdown: false,
    description: '',
  });
}

async function saveOneAnniversary(item: Dashboard['anniversaries'][number]) {
  await withRowBusy('anniversary', item, async () => {
    try {
      const payload = {
        ...item,
        eventDate: String(item.eventDate || '').slice(0, 10),
      };
      const saved = await saveAnniversary(payload);
      Object.assign(item, saved);
      const synced = syncPageSettingsFromAnniversary(saved);
      if (synced && dashboard.value) {
        await saveSite(dashboard.value.site);
        await pruneDuplicateSyncedAnniversaries([saved]);
      }
      ElMessage.success(synced ? '纪念日已保存，并同步到页面配置' : '纪念日已保存');
      await load();
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '纪念日保存失败'));
    }
  });
}

async function removeAnniversary(item: Dashboard['anniversaries'][number], index: number) {
  await withRowBusy('anniversary', item, async () => {
    try {
      await confirmDelete('确认删除这个纪念日？');
      if (item.id) await deleteAnniversary(item.id);
      const synced = clearPageSettingsFromAnniversary(item);
      if (synced && dashboard.value) {
        await saveSite(dashboard.value.site);
      }
      removeListItem(dashboard.value?.anniversaries, item, index);
      ElMessage.success('纪念日已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '纪念日删除失败'));
    }
  });
}

async function uploadAvatar(options: UploadRequestOptions, profile: Dashboard['profiles'][number]) {
  try {
    const file = await compressImageFile(options.file, { maxSize: 600, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'avatar' });
    profile.avatarUrl = publicUrl;
    await saveProfileAndSite();
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('头像上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadMedia(options: UploadRequestOptions) {
  try {
    const file = options.file;
    const uploadFile = file.type.startsWith('video/')
      ? file
      : await compressImageFile(file, { maxSize: 1600, quality: 0.86 });
    const uploaded = await uploadFileToObjectStorage(uploadFile, { purpose: 'album', folder: uploadMeta.albumTitle || '默认相册' });
    const thumbnailUrl = file.type.startsWith('video/')
      ? await uploadVideoPoster(file)
      : uploaded.publicUrl;
    const savedItem = await completeMediaUpload({
      objectKey: uploaded.objectKey,
      url: uploaded.publicUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      mimeType: uploadFile.type || file.type || 'application/octet-stream',
      size: uploadFile.size,
      title: uploadMeta.title || file.name,
      albumTitle: uploadMeta.albumTitle || '默认相册',
      location: uploadMeta.location,
      takenAt: uploadMeta.takenAt || new Date().toISOString().slice(0, 10),
      tags: uploadMeta.tags.split(',').map((item) => item.trim()).filter(Boolean),
      visibility: uploadMeta.visibility,
    });
    if (dashboard.value && savedItem?.id) {
      dashboard.value.albumItems = [
        savedItem as Dashboard['albumItems'][number],
        ...dashboard.value.albumItems.filter((item) => item.id !== savedItem.id),
      ];
    }
    ElMessage.success('媒体已上传，已先显示在列表中');
    options.onSuccess?.({});
    void load();
  } catch (error) {
    ElMessage.error('媒体上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function removeAlbumItem(item: Dashboard['albumItems'][number]) {
  await withRowBusy('album', item, async () => {
    try {
      await confirmDelete('确认删除这张照片？');
      await deleteAlbumItem(item.id);
      ElMessage.success('照片已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '照片删除失败'));
    }
  });
}

function openAlbumEditor(item: Dashboard['albumItems'][number]) {
  albumEditor.id = item.id;
  albumEditor.form = {
    title: item.title,
    albumTitle: item.album,
    location: item.location,
    takenAt: item.takenAt,
    tagsText: item.tags.join(','),
    favorite: item.favorite,
    visibility: item.visibility,
  };
  albumEditor.visible = true;
}

async function saveAlbumEditor() {
  if (!albumEditor.id) return;
  if (albumEditor.saving) return;
  albumEditor.saving = true;
  try {
    await updateAlbumItem(albumEditor.id, {
      title: albumEditor.form.title,
      albumTitle: albumEditor.form.albumTitle,
      location: albumEditor.form.location,
      takenAt: albumEditor.form.takenAt,
      tags: albumEditor.form.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
      favorite: albumEditor.form.favorite,
      visibility: albumEditor.form.visibility,
    });
    albumEditor.visible = false;
    ElMessage.success('媒体信息已保存，前台会自动同步');
    await load();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '媒体信息保存失败'));
  } finally {
    albumEditor.saving = false;
  }
}

function addLetter() {
  dashboard.value?.letters.unshift({
    id: '',
    title: '新的情书',
    body: '',
    signature: '',
    letterDate: new Date().toISOString().slice(0, 10),
    status: 'PUBLISHED',
    visibleAt: '',
  });
}

async function saveOneLetter(item: Dashboard['letters'][number]) {
  await withRowBusy('letter', item, async () => {
    try {
      const saved = await saveLetter(item);
      item.id = saved.id;
      ElMessage.success('情书已保存');
      await load();
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '情书保存失败'));
    }
  });
}

async function removeLetter(item: Dashboard['letters'][number], index: number) {
  await withRowBusy('letter', item, async () => {
    try {
      await confirmDelete('确认删除这封情书？');
      if (item.id) await deleteLetter(item.id);
      removeListItem(dashboard.value?.letters, item, index);
      ElMessage.success('情书已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '情书删除失败'));
    }
  });
}

function addSong() {
  dashboard.value?.songs.unshift({ id: '', title: '新的歌曲', artist: '', duration: 0, coverUrl: '', audioUrl: '', lyric: '', favorite: false });
}

function formatDurationInput(duration = 0) {
  const total = Math.max(0, Math.round(Number(duration) || 0));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseDurationInput(value: string) {
  const text = String(value || '').trim();
  if (!text) return 0;
  if (!text.includes(':')) return Math.max(0, Math.round(Number(text) || 0));
  const [minutes, seconds = '0'] = text.split(':');
  return Math.max(0, (Number(minutes) || 0) * 60 + Math.min(59, Number(seconds) || 0));
}

async function saveOneSong(item: Dashboard['songs'][number], options: { silent?: boolean } = {}) {
  return withRowBusy('song', item, async () => {
    try {
      const saved = await saveSong(item);
      item.id = saved.id;
      if (!options.silent) ElMessage.success('歌曲已保存');
      await load();
      return saved;
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '歌曲保存失败'));
      throw error;
    }
  });
}

async function uploadSongAudio(options: UploadRequestOptions, item: Dashboard['songs'][number]) {
  try {
    const file = options.file;
    if (!file.type.includes('mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      ElMessage.error('请上传 MP3 文件');
      options.onError?.(new Error('Only MP3 is supported') as never);
      return;
    }
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'music-audio', folder: item.title || '未命名歌曲' });
    item.audioUrl = publicUrl;
    if (!item.title || item.title === '新的歌曲') item.title = file.name.replace(/\.[^.]+$/, '');
    if (!item.duration) item.duration = await getAudioDuration(file);
    await saveOneSong(item, { silent: true });
    ElMessage.success('MP3 已上传并保存');
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('MP3 上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadSongCover(options: UploadRequestOptions, item: Dashboard['songs'][number]) {
  try {
    const file = await compressImageFile(options.file, { maxSize: 800, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'music-cover', folder: item.title || '未命名歌曲' });
    item.coverUrl = publicUrl;
    await saveOneSong(item, { silent: true });
    ElMessage.success('封面已上传并保存');
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('封面上传失败');
    options.onError?.(error as never);
  }
}

function parseLyricsMetadata(text: string) {
  const artist = text.match(/^\[ar:(.*?)\]$/im)?.[1]?.trim() || '';
  const title = text.match(/^\[ti:(.*?)\]$/im)?.[1]?.trim() || '';
  return { artist, title };
}

function formatLyricStatus(text = '') {
  const normalized = String(text || '').trim();
  if (!normalized) return '请直接上传 .lrc / .txt 歌词文件';
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lyricLines = lines.filter((line) => /^\[\d{2}:\d{2}(?:[.:]\d{1,3})?\]/.test(line) || !/^\[[a-z]+:/i.test(line));
  return `共 ${lyricLines.length || lines.length} 行，前台会自动滚动显示`;
}

async function readLyricsFileText(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const encodings = ['utf-8', 'gb18030', 'utf-16le'];
  for (const encoding of encodings) {
    try {
      const decoded = new TextDecoder(encoding as any, { fatal: encoding === 'utf-8' }).decode(bytes);
      if (decoded.trim()) return decoded.replace(/^\uFEFF/, '');
    } catch {
      continue;
    }
  }
  return new TextDecoder().decode(bytes).replace(/^\uFEFF/, '');
}

async function uploadSongLyricsFile(options: UploadRequestOptions, item: Dashboard['songs'][number]) {
  try {
    const file = options.file;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.lrc') && !lowerName.endsWith('.txt') && !(file.type || '').includes('text')) {
      ElMessage.error('请上传 .lrc 或 .txt 歌词文件');
      options.onError?.(new Error('Only lyric files are supported') as never);
      return;
    }
    const text = await readLyricsFileText(file);
    if (!text.trim()) {
      ElMessage.warning('歌词文件内容是空的');
      options.onError?.(new Error('Empty lyric file') as never);
      return;
    }
    item.lyric = text;
    const metadata = parseLyricsMetadata(text);
    if ((!item.title || item.title === '新的歌曲') && metadata.title) item.title = metadata.title;
    if (!item.artist && metadata.artist) item.artist = metadata.artist;
    if (item.title && item.artist) {
      await saveOneSong(item, { silent: true });
      ElMessage.success('歌词文件已导入并保存');
    } else {
      ElMessage.success('歌词文件已导入，请补全歌名和歌手后保存');
    }
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('歌词文件导入失败');
    options.onError?.(error as never);
  }
}

function getAudioDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const duration = Math.max(0, Math.round(audio.duration || 0));
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}

function ensureMusicSettings() {
  if (!dashboard.value) return;
  if (!dashboard.value.site.settings.music) {
    dashboard.value.site.settings.music = { bgmSongId: '', volume: 70, autoplay: false, moodPlaylists: [] };
  }
  dashboard.value.site.settings.music.bgmSongId ??= '';
  dashboard.value.site.settings.music.volume ??= 70;
  dashboard.value.site.settings.music.autoplay ??= false;
  if (!Array.isArray(dashboard.value.site.settings.music.moodPlaylists)) {
    dashboard.value.site.settings.music.moodPlaylists = [];
  }
  const validSongIds = new Set((dashboard.value.songs || []).map((song) => song.id).filter(Boolean));
  if (dashboard.value.site.settings.music.bgmSongId && !validSongIds.has(dashboard.value.site.settings.music.bgmSongId)) {
    dashboard.value.site.settings.music.bgmSongId = '';
  }
  dashboard.value.site.settings.music.moodPlaylists = dashboard.value.site.settings.music.moodPlaylists.map((playlist, index) => ({
    id: playlist.id || `mood-${Date.now()}-${index}`,
    title: playlist.title || '新的心情歌单',
    description: playlist.description || '',
    coverUrl: playlist.coverUrl || '',
    songIds: Array.from(new Set((Array.isArray(playlist.songIds) ? playlist.songIds : [])
      .map((id) => String(id || '').trim())
      .filter((id) => id && validSongIds.has(id)))),
  }));
}

function ensurePrivacyReminderSettings() {
  if (!dashboard.value) return;
  dashboard.value.site.settings.privacy = {
    passwordEnabled: false,
    password: '520',
    shareLinkEnabled: false,
    privateAlbum: dashboard.value.site.settings.privacy?.privateAlbum ?? false,
  };
  dashboard.value.site.settings.reminders = {
    anniversaryEnabled: dashboard.value.site.settings.reminders?.anniversaryEnabled ?? true,
    anniversaryDays: dashboard.value.site.settings.reminders?.anniversaryDays ?? 1,
    surpriseEnabled: dashboard.value.site.settings.reminders?.surpriseEnabled ?? true,
    dailyQuoteEnabled: dashboard.value.site.settings.reminders?.dailyQuoteEnabled ?? true,
    dailyQuoteTime: dashboard.value.site.settings.reminders?.dailyQuoteTime || '20:00',
  };
}

function ensureCoupleEntranceSettings() {
  if (!dashboard.value) return;
  const current = dashboard.value.site.settings.coupleEntrance || {};
  dashboard.value.site.settings.coupleEntrance = {
    mark: current.mark || '♡',
    imageUrl: current.imageUrl || '',
    title: current.title || '情侣入口',
    subtitle: current.subtitle || '输入只属于你们的暗号，进入这座温柔收藏的小世界。',
    nameLabel: current.nameLabel || '浪漫账号',
    namePlaceholder: current.namePlaceholder || 'love',
    passwordLabel: current.passwordLabel || '秘密暗号',
    passwordPlaceholder: current.passwordPlaceholder || '输入你们的密码',
    submitText: current.submitText || '进入我们的世界',
  };
}

function ensureHeartGardenSettings() {
  if (!dashboard.value) return;
  dashboard.value.site.settings.heartGarden ||= { projects: [] };
  if (!Array.isArray(dashboard.value.site.settings.heartGarden.projects)) {
    dashboard.value.site.settings.heartGarden.projects = [];
  }
  dashboard.value.site.settings.heartGarden.projects = dashboard.value.site.settings.heartGarden.projects.filter((project) => project.type === 'html');
  dashboard.value.site.settings.heartGarden.projects.forEach((project) => {
    project.id ||= `garden-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    project.title ||= '新的心动项目';
    project.type = 'html';
    if (!['particle', 'confession', 'custom'].includes(project.group)) project.group = 'custom';
    project.tag ||= '自定义';
    project.icon ||= '🌹';
    project.description ||= '';
    project.url ||= '';
    project.cover ||= '';
    project.status = project.url || project.content ? 'ready' : 'pending';
    project.entryFile ||= 'index.html';
    project.files = Array.isArray(project.files)
      ? project.files
        .filter((file) => file?.path)
        .map((file) => ({
          id: file.id || `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          path: normalizeHeartGardenFilePath(file.path),
          type: normalizeHeartGardenFileType(file.path, file.type),
          content: file.content,
          url: file.url,
          objectKey: file.objectKey,
          size: file.size,
        }))
      : [];
    if (!project.files.length && project.content) {
      project.files = [{
        id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        path: project.entryFile || 'index.html',
        type: 'html',
        content: project.content,
      }];
    }
    project.linkedAssets = Array.isArray(project.linkedAssets)
      ? project.linkedAssets
        .filter((asset) => asset?.url)
        .map((asset) => {
          const sourceType = ['album', 'video', 'song'].includes(String(asset.sourceType))
            ? asset.sourceType
            : 'album';
          return {
            id: asset.id || `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            sourceType,
            sourceId: asset.sourceId || asset.id || '',
            title: asset.title || '站内素材',
            url: asset.url,
          };
        })
      : [];
  });
}

function addHeartGardenProject() {
  ensureHeartGardenSettings();
  dashboard.value?.site.settings.heartGarden.projects.unshift({
    id: `garden-${Date.now()}`,
    title: '新的心动项目',
    type: 'html',
    group: 'custom',
    tag: '自定义',
    icon: '🌹',
    description: '写下这个小浪漫想表达的心意',
    url: '',
    cover: '',
    status: 'pending',
    content: '',
    linkedAssets: [],
    entryFile: 'index.html',
    files: [{
      id: `file-${Date.now()}-index`,
      path: 'index.html',
      type: 'html',
      content: '<!doctype html>\n<html lang="zh-CN">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>新的心动项目</title>\n</head>\n<body>\n  <h1>写下你的小浪漫</h1>\n</body>\n</html>\n',
    }],
  });
}

function moveHeartGardenProject(index: number, direction: -1 | 1) {
  const projects = dashboard.value?.site.settings.heartGarden.projects;
  if (!projects) return;
  const next = index + direction;
  if (next < 0 || next >= projects.length) return;
  const [item] = projects.splice(index, 1);
  projects.splice(next, 0, item);
}

async function removeHeartGardenProject(_item: HeartGardenProject, index: number) {
  await withRowBusy('heartGarden', _item, async () => {
    try {
      await confirmDelete('确认删除这个心动花园项目？');
      dashboard.value?.site.settings.heartGarden.projects.splice(index, 1);
      if (dashboard.value) {
        ensureHeartGardenSettings();
        await saveSite(dashboard.value.site);
      }
      ElMessage.success('心动花园项目已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '心动花园项目删除失败'));
    }
  });
}

async function uploadHeartGardenCover(options: UploadRequestOptions, item: HeartGardenProject) {
  await withRowBusy('heartGarden', item, async () => {
    try {
      const file = await compressImageFile(options.file, { maxSize: 1200, quality: 0.86 });
      const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'heart-garden-cover', folder: item.tag || item.title, group: item.group || item.tag });
      item.cover = publicUrl;
      options.onSuccess?.({});
      ElMessage.success('封面已上传');
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '封面上传失败'));
      options.onError?.(error as never);
    }
  });
}

async function uploadHeartGardenHtml(options: UploadRequestOptions, item: HeartGardenProject) {
  await withRowBusy('heartGarden', item, async () => {
    try {
      const file = options.file;
      if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
        ElMessage.error('请上传 .html 或 .htm 文件');
        options.onError?.(new Error('Only HTML is supported') as never);
        return;
      }
      if (file.size > 1024 * 1024) {
        ElMessage.error('单文件 HTML 请控制在 1MB 以内；整套项目建议放进爱心代码合集后填写地址');
        options.onError?.(new Error('HTML is too large') as never);
        return;
      }
      const uploaded = await uploadFileToObjectStorage(file, { purpose: 'heart-garden-html', folder: item.tag || item.title, group: item.group || item.tag });
      item.content = '';
      item.url = uploaded.publicUrl;
      item.type = 'html';
      item.group ||= 'custom';
      item.status = 'ready';
      if (!item.title || item.title === '新的心动项目') item.title = file.name.replace(/\.[^.]+$/, '');
      options.onSuccess?.({});
      ElMessage.success('HTML 已上传到心动花园分类文件夹，保存后前台可预览');
    } catch (error) {
      ElMessage.error(getErrorMessage(error, 'HTML 上传失败'));
      options.onError?.(error as never);
    }
  });
}

async function saveHeartGarden() {
  if (!dashboard.value) return;
  ensureHeartGardenSettings();
  await saveSite(dashboard.value.site);
  ElMessage.success('心动花园已保存，前台会自动同步');
}

async function saveHeartGardenProject(item: HeartGardenProject) {
  await withRowBusy('heartGarden', item, async () => {
    try {
      if (!dashboard.value) return;
      ensureHeartGardenSettings();
      await saveSite(dashboard.value.site);
      ElMessage.success(`《${item.title || '未命名项目'}》已保存`);
      await load();
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '心动花园项目保存失败'));
    }
  });
}

function openHeartGardenAssetPicker(project: HeartGardenProject) {
  assetPicker.project = project;
  assetPicker.activeTab = 'images';
  assetPicker.snippet = '';
  assetPicker.selectedTitle = '';
  assetPicker.visible = true;
}

function escapeHtmlAttribute(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHeartGardenSnippet(asset: HeartGardenAsset) {
  const url = escapeHtmlAttribute(asset.url);
  const title = escapeHtmlAttribute(asset.title);
  if (asset.snippetType === 'image') {
    return `<img src="${url}" alt="${title}" loading="lazy" style="max-width:100%;height:auto;border-radius:16px;" />`;
  }
  if (asset.snippetType === 'video') {
    const poster = asset.thumbUrl ? ` poster="${escapeHtmlAttribute(asset.thumbUrl)}"` : '';
    return `<video src="${url}"${poster} controls playsinline preload="metadata" style="max-width:100%;border-radius:16px;"></video>`;
  }
  return `<audio src="${url}" controls preload="metadata" style="width:100%;"></audio>`;
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

async function selectHeartGardenAsset(asset: HeartGardenAsset) {
  if (!assetPicker.project) return;
  assetPicker.project.linkedAssets ||= [];
  if (!assetPicker.project.linkedAssets.some((item) => item.url === asset.url)) {
    assetPicker.project.linkedAssets.push({
      id: `linked-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sourceType: asset.sourceType,
      sourceId: asset.sourceId,
      title: asset.title,
      url: asset.url,
    });
  }
  assetPicker.snippet = buildHeartGardenSnippet(asset);
  assetPicker.selectedTitle = asset.title;
  await writeClipboardText(assetPicker.snippet);
  ElMessage.success('素材代码已复制，可以粘到 HTML 里');
}

async function copyHeartGardenSnippet() {
  if (!assetPicker.snippet) return;
  await writeClipboardText(assetPicker.snippet);
  ElMessage.success('HTML 片段已复制');
}

function removeHeartGardenLinkedAsset(project: HeartGardenProject, assetId: string) {
  project.linkedAssets = (project.linkedAssets || []).filter((asset) => asset.id !== assetId);
}

function normalizeHeartGardenFilePath(path: string) {
  return String(path || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .replace(/\.\./g, '')
    || 'index.html';
}

function normalizeHeartGardenFileType(path: string, fallback?: HeartGardenFile['type']): HeartGardenFile['type'] {
  const text = String(path || '').toLowerCase();
  if (text.endsWith('.html') || text.endsWith('.htm')) return 'html';
  if (text.endsWith('.css')) return 'css';
  if (text.endsWith('.js') || text.endsWith('.mjs')) return 'js';
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(text)) return 'image';
  if (/\.(mp3|wav|ogg|m4a|flac)$/.test(text)) return 'audio';
  if (/\.(mp4|webm|mov|m4v)$/.test(text)) return 'video';
  return fallback || 'other';
}

function isHeartGardenTextFile(file: HeartGardenFile | { type: HeartGardenFile['type']; path: string }) {
  return ['html', 'css', 'js'].includes(file.type);
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('File read failed'));
    reader.readAsText(file);
  });
}

function heartGardenAssetPath(file: File) {
  const type = normalizeHeartGardenFileType(file.name);
  if (type === 'image') return `images/${file.name}`;
  if (type === 'audio') return `audio/${file.name}`;
  if (type === 'video') return `video/${file.name}`;
  return `assets/${file.name}`;
}

function ensureHeartGardenProjectFiles(project: HeartGardenProject) {
  project.entryFile ||= 'index.html';
  project.files ||= [];
  if (!project.files.length) {
    project.files.push({
      id: `file-${Date.now()}-index`,
      path: project.entryFile,
      type: 'html',
      content: project.content || '<!doctype html>\n<html lang="zh-CN">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>心动花园</title>\n</head>\n<body>\n  <h1>心动花园</h1>\n</body>\n</html>\n',
    });
  }
}

function openHeartGardenCodeEditor(project: HeartGardenProject) {
  ensureHeartGardenProjectFiles(project);
  codeEditor.project = project;
  codeEditor.entryFile = project.entryFile || 'index.html';
  codeEditor.activeFileId = project.files?.[0]?.id || '';
  codeEditor.newFilePath = '';
  codeEditor.visible = true;
}

function selectHeartGardenFile(fileId: string) {
  codeEditor.activeFileId = fileId;
}

function addHeartGardenFile() {
  if (!codeEditor.project) return;
  const path = normalizeHeartGardenFilePath(codeEditor.newFilePath);
  if (!path) return;
  codeEditor.project.files ||= [];
  if (codeEditor.project.files.some((file) => file.path === path)) {
    ElMessage.warning('这个文件已经存在');
    return;
  }
  const type = normalizeHeartGardenFileType(path);
  const content = type === 'css'
    ? 'body {\n  margin: 0;\n}\n'
    : type === 'js'
      ? "console.log('heart garden');\n"
      : type === 'html'
        ? '<!doctype html>\n<html lang="zh-CN">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>心动花园</title>\n</head>\n<body>\n\n</body>\n</html>\n'
        : '';
  const file: HeartGardenFile = {
    id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    path,
    type,
    content,
  };
  codeEditor.project.files.push(file);
  codeEditor.activeFileId = file.id;
  if (type === 'html' && !codeEditor.entryFile) codeEditor.entryFile = path;
  codeEditor.newFilePath = '';
}

async function uploadHeartGardenProjectAsset(options: UploadRequestOptions) {
  if (!codeEditor.project) return;
  try {
    const file = options.file;
    const uploaded = await uploadFileToObjectStorage(file, {
      purpose: 'heart-garden-asset',
      folder: codeEditor.project.title,
      group: codeEditor.project.title || codeEditor.project.group || codeEditor.project.tag,
    });
    const assetFile: HeartGardenFile = {
      id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      path: heartGardenAssetPath(file),
      type: normalizeHeartGardenFileType(file.name),
      url: uploaded.publicUrl,
      objectKey: uploaded.objectKey,
      size: file.size,
    };
    codeEditor.project.files ||= [];
    codeEditor.project.files.push(assetFile);
    codeEditor.activeFileId = assetFile.id;
    options.onSuccess?.({});
    ElMessage.success('项目素材已上传，可以复制 URL 引用');
  } catch (error) {
    ElMessage.error('项目素材上传失败，请确认 R2 已配置');
    options.onError?.(error as never);
  }
}

function triggerHeartGardenFolderPicker() {
  heartGardenFolderInputRef.value?.click();
}

function relativeHeartGardenFolderPath(file: File, rootFolder = '') {
  const rawPath = normalizeHeartGardenFilePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
  if (!rootFolder) return rawPath;
  return rawPath.startsWith(`${rootFolder}/`) ? rawPath.slice(rootFolder.length + 1) : rawPath;
}

function detectHeartGardenFolderRoot(files: File[]) {
  const firstPath = normalizeHeartGardenFilePath((files[0] as File & { webkitRelativePath?: string } | undefined)?.webkitRelativePath || '');
  if (!firstPath.includes('/')) return '';
  const root = firstPath.split('/')[0];
  return files.every((file) => normalizeHeartGardenFilePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || '').startsWith(`${root}/`))
    ? root
    : '';
}

async function uploadHeartGardenFolder(event: Event) {
  const input = event.target as HTMLInputElement;
  const nativeFiles = Array.from(input.files || []);
  input.value = '';
  if (!codeEditor.project || !nativeFiles.length) return;
  const project = codeEditor.project;
  const rootFolder = detectHeartGardenFolderRoot(nativeFiles);
  project.files = [];
  let uploadedAssets = 0;
  try {
    for (const nativeFile of nativeFiles) {
      const path = relativeHeartGardenFolderPath(nativeFile, rootFolder);
      if (!path || path.endsWith('/')) continue;
      const type = normalizeHeartGardenFileType(path);
      const baseFile = {
        id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        path,
        type,
        size: nativeFile.size,
      };
      if (isHeartGardenTextFile(baseFile)) {
        project.files.push({
          ...baseFile,
          content: await readFileAsText(nativeFile),
        });
      } else {
        const uploaded = await uploadFileToObjectStorage(nativeFile, {
          purpose: 'heart-garden-asset',
          folder: project.title,
          group: rootFolder || project.title || project.group || project.tag,
        });
        project.files.push({
          ...baseFile,
          url: uploaded.publicUrl,
          objectKey: uploaded.objectKey,
        });
        uploadedAssets += 1;
      }
    }
    const entry = project.files.find((file) => file.path.toLowerCase() === 'index.html' && file.type === 'html')
      || project.files.find((file) => file.type === 'html');
    project.entryFile = entry?.path || 'index.html';
    codeEditor.entryFile = project.entryFile;
    codeEditor.activeFileId = entry?.id || project.files[0]?.id || '';
    project.content = compileHeartGardenProject(project, project.entryFile);
    project.status = project.content || project.url ? 'ready' : 'pending';
    if ((!project.title || project.title === '新的心动项目') && rootFolder) project.title = rootFolder;
    ElMessage.success(`文件夹已导入：${project.files.length} 个文件，${uploadedAssets} 个素材已上传`);
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '文件夹上传失败，请检查文件大小或 R2 配置'));
  }
}

function removeHeartGardenFile(fileId: string) {
  if (!codeEditor.project?.files) return;
  const target = codeEditor.project.files.find((file) => file.id === fileId);
  if (target?.path === codeEditor.entryFile) {
    ElMessage.warning('入口文件不能直接删除，请先切换入口文件');
    return;
  }
  codeEditor.project.files = codeEditor.project.files.filter((file) => file.id !== fileId);
  codeEditor.activeFileId = codeEditor.project.files[0]?.id || '';
}

function isExternalAssetPath(value: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(String(value || '').trim());
}

function splitAssetPathSuffix(value: string) {
  const text = String(value || '');
  const index = text.search(/[?#]/);
  if (index < 0) return { pathname: text, suffix: '' };
  return { pathname: text.slice(0, index), suffix: text.slice(index) };
}

function normalizeRelativeAssetPath(value: string, basePath = '') {
  const text = String(value || '').trim().replace(/\\/g, '/');
  if (!text || isExternalAssetPath(text)) return '';
  const { pathname } = splitAssetPathSuffix(text);
  const baseParts = basePath.includes('/') ? basePath.split('/').slice(0, -1) : [];
  const parts = pathname.startsWith('/') ? [] : baseParts;
  pathname.split('/').forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') {
      parts.pop();
      return;
    }
    parts.push(part);
  });
  return parts.join('/');
}

function createHeartGardenAssetUrlResolver(files: HeartGardenFile[]) {
  const assetMap = new Map<string, string>();
  files.forEach((file) => {
    if (!file.url) return;
    assetMap.set(normalizeRelativeAssetPath(file.path), file.url);
  });
  return (value: string, basePath = '') => {
    const text = String(value || '').trim();
    if (!text || isExternalAssetPath(text)) return value;
    const { pathname, suffix } = splitAssetPathSuffix(text);
    const normalized = normalizeRelativeAssetPath(pathname, basePath);
    return normalized && assetMap.has(normalized) ? `${assetMap.get(normalized)}${suffix}` : value;
  };
}

function rewriteCssAssetUrls(css: string, basePath: string, resolveAssetUrl: (value: string, basePath?: string) => string) {
  return String(css || '').replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, rawUrl) => {
    const resolved = resolveAssetUrl(rawUrl, basePath);
    return resolved === rawUrl ? match : `url(${quote}${resolved}${quote})`;
  });
}

function rewriteScriptAssetUrls(script: string, basePath: string, resolveAssetUrl: (value: string, basePath?: string) => string) {
  const assetPattern = /\.(?:png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|flac|mp4|webm|mov|m4v)(?:[?#][^"'`]*)?$/i;
  return String(script || '').replace(/(["'`])([^"'`\n\r]+)\1/g, (match, quote, rawValue) => {
    const value = String(rawValue || '').trim();
    if (!assetPattern.test(value)) return match;
    const resolved = resolveAssetUrl(value, basePath);
    return resolved === value ? match : `${quote}${resolved.replace(new RegExp(quote, 'g'), `\\${quote}`)}${quote}`;
  });
}

function rewriteHtmlAssetUrls(html: string, basePath: string, resolveAssetUrl: (value: string, basePath?: string) => string) {
  let result = String(html || '').replace(/\b(src|href|poster)=("([^"]*)"|'([^']*)')/gi, (match, attr, wrapped, doubleValue, singleValue) => {
    const rawValue = doubleValue ?? singleValue ?? '';
    const resolved = resolveAssetUrl(rawValue, basePath);
    if (resolved === rawValue) return match;
    const quote = wrapped.startsWith("'") ? "'" : '"';
    return `${attr}=${quote}${escapeHtmlAttribute(resolved)}${quote}`;
  });
  result = result.replace(/\bsrcset=("([^"]*)"|'([^']*)')/gi, (match, wrapped, doubleValue, singleValue) => {
    const rawValue = doubleValue ?? singleValue ?? '';
    const rewritten = rawValue.split(',').map((candidate: string) => {
      const parts = candidate.trim().split(/\s+/);
      if (!parts[0]) return candidate;
      const resolved = resolveAssetUrl(parts[0], basePath);
      return [resolved, ...parts.slice(1)].join(' ');
    }).join(', ');
    if (rewritten === rawValue) return match;
    const quote = wrapped.startsWith("'") ? "'" : '"';
    return `srcset=${quote}${escapeHtmlAttribute(rewritten)}${quote}`;
  });
  result = rewriteCssAssetUrls(result, basePath, resolveAssetUrl);
  return result.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
    const rewritten = rewriteScriptAssetUrls(content, basePath, resolveAssetUrl);
    return rewritten === content ? match : match.replace(content, rewritten);
  });
}

function findHeartGardenFileByReference(
  files: HeartGardenFile[],
  reference: string,
  basePath: string,
  types: HeartGardenFile['type'][],
) {
  const text = String(reference || '').trim();
  if (!text || isExternalAssetPath(text)) return undefined;
  const normalized = normalizeRelativeAssetPath(text, basePath);
  return files.find((file) => types.includes(file.type) && normalizeRelativeAssetPath(file.path) === normalized);
}

function inlineHeartGardenLinkedFiles(
  html: string,
  files: HeartGardenFile[],
  entryPath: string,
  resolveAssetUrl: (value: string, basePath?: string) => string,
) {
  let result = String(html || '').replace(/<link\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>/gi, (match, _quote, href) => {
    const file = findHeartGardenFileByReference(files, href, entryPath, ['css']);
    if (!file?.content) return match;
    const content = rewriteCssAssetUrls(file.content, file.path, resolveAssetUrl);
    return `<style data-file="${escapeHtmlAttribute(file.path)}">\n${content}\n</style>`;
  });

  const scriptEndTag = '<' + '\\/script>';
  result = result.replace(new RegExp(`<script\\b[^>]*\\bsrc=(["'])([^"']+)\\1[^>]*>\\s*${scriptEndTag}`, 'gi'), (match, _quote, src) => {
    const file = findHeartGardenFileByReference(files, src, entryPath, ['js']);
    if (!file?.content) return match;
    const rewritten = rewriteScriptAssetUrls(file.content, file.path, resolveAssetUrl);
    const content = rewritten.replace(new RegExp(scriptEndTag, 'gi'), '<\\/script');
    const closeTag = '<' + '/script>';
    return `<script data-file="${escapeHtmlAttribute(file.path)}">\n${content}\n${closeTag}`;
  });

  return result;
}

function compileHeartGardenProject(project: HeartGardenProject, entryPath: string) {
  const files = project.files || [];
  const entry = files.find((file) => file.path === entryPath && file.type === 'html') || files.find((file) => file.type === 'html');
  if (!entry?.content) return '';
  const resolveAssetUrl = createHeartGardenAssetUrlResolver(files);
  const html = inlineHeartGardenLinkedFiles(entry.content, files, entry.path, resolveAssetUrl);
  return rewriteHtmlAssetUrls(html, entry.path, resolveAssetUrl);
}

function saveHeartGardenCodeProject() {
  if (!codeEditor.project) return;
  const entryPath = normalizeHeartGardenFilePath(codeEditor.entryFile || codeEditor.project.entryFile || 'index.html');
  codeEditor.project.entryFile = entryPath;
  codeEditor.project.content = compileHeartGardenProject(codeEditor.project, entryPath);
  codeEditor.project.type = 'html';
  codeEditor.project.status = codeEditor.project.content || codeEditor.project.url ? 'ready' : 'pending';
  codeEditor.visible = false;
  ElMessage.success('代码编辑区已保存，记得保存心动花园同步到前台');
}

async function copyTextValue(text: string) {
  if (!text) return;
  await writeClipboardText(text);
  ElMessage.success('已复制');
}

function addMoodPlaylist() {
  ensureMusicSettings();
  dashboard.value?.site.settings.music.moodPlaylists.push({
    id: `mood-${Date.now()}`,
    title: '新的心情歌单',
    description: '写下这个歌单的氛围',
    coverUrl: '',
    songIds: [],
  });
}

async function saveMoodPlaylist(item: Dashboard['site']['settings']['music']['moodPlaylists'][number]) {
  await withRowBusy('playlist', item, async () => {
    try {
      await saveMusicSettings({ silent: true });
      ElMessage.success(`歌单「${item.title || '未命名歌单'}」已保存`);
      await load();
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '歌单保存失败'));
    }
  });
}

async function removeMoodPlaylist(item: Dashboard['site']['settings']['music']['moodPlaylists'][number], index: number) {
  await withRowBusy('playlist', item, async () => {
    try {
      await confirmDelete('确认删除这个心情歌单？');
      dashboard.value?.site.settings.music.moodPlaylists.splice(index, 1);
      await saveMusicSettings({ silent: true });
      ElMessage.success('心情歌单已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '心情歌单删除失败'));
    }
  });
}

async function uploadMoodPlaylistCover(
  options: UploadRequestOptions,
  item: Dashboard['site']['settings']['music']['moodPlaylists'][number],
) {
  await withRowBusy('playlist', item, async () => {
    try {
      const file = await compressImageFile(options.file, { maxSize: 1000, quality: 0.86 });
      const { publicUrl } = await uploadFileToObjectStorage(file, { purpose: 'music-playlist-cover', folder: item.title || '心情歌单' });
      item.coverUrl = publicUrl;
      await saveMusicSettings({ silent: true });
      options.onSuccess?.({});
      ElMessage.success('歌单封面已上传并保存');
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '歌单封面上传失败'));
      options.onError?.(error as never);
    }
  });
}

async function saveMusicSettings(options: { silent?: boolean } = {}) {
  if (!dashboard.value) return;
  ensureMusicSettings();
  const savedSite = await saveSite(dashboard.value.site);
  dashboard.value.site = savedSite;
  if (!options.silent) {
    ElMessage.success('音乐设置已保存，前台会自动同步');
  }
}

async function savePrivacyAndReminders() {
  if (!dashboard.value) return;
  ensurePrivacyReminderSettings();
  ensureCoupleEntranceSettings();
  await saveSite(dashboard.value.site);
  ElMessage.success('隐私与提醒已保存，前台会自动同步');
}

async function saveAiSettings() {
  aiSaving.value = true;
  try {
    const saved = await saveAiConfig({
      ...aiConfig,
      apiKey: aiApiKeyDraft.value.trim() || undefined,
    });
    Object.assign(aiConfig, saved);
    aiApiKeyDraft.value = '';
    ElMessage.success('AI 设置已保存');
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'AI 设置保存失败'));
  } finally {
    aiSaving.value = false;
  }
}

async function testAiSettings() {
  aiTesting.value = true;
  try {
    await saveAiSettings();
    const result = await testAiConfig();
    ElMessage.success(result.message || 'AI 连接成功');
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'AI 连接测试失败'));
  } finally {
    aiTesting.value = false;
  }
}

async function rebuildAiKnowledgeNow() {
  aiRebuilding.value = true;
  try {
    const snapshot = await rebuildAiKnowledge();
    aiKnowledgeSummary.value = snapshot.summary || '';
    aiKnowledgeUpdatedAt.value = snapshot.updatedAt || '';
    ElMessage.success('心语已重新学习当前网站内容');
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '重新学习失败'));
  } finally {
    aiRebuilding.value = false;
  }
}

async function loadAiMemories() {
  aiMemoryLoading.value = true;
  try {
    aiMemories.value = await fetchAiMemories();
    const snapshot = await fetchAiKnowledge().catch(() => null);
    aiKnowledgeSummary.value = snapshot?.summary || aiKnowledgeSummary.value;
    aiKnowledgeUpdatedAt.value = snapshot?.updatedAt || aiKnowledgeUpdatedAt.value;
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'AI 记忆加载失败'));
  } finally {
    aiMemoryLoading.value = false;
  }
}

async function loadAiActions() {
  aiActionLoading.value = true;
  try {
    aiActions.value = await fetchAiActions();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'AI 操作记录加载失败'));
  } finally {
    aiActionLoading.value = false;
  }
}

function aiActionStatusText(status: string) {
  if (status === 'pending') return '待确认';
  if (status === 'done') return '已写入';
  if (status === 'rejected') return '已拒绝';
  return status || '未知';
}

function aiActionStatusType(status: string) {
  if (status === 'pending') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'rejected') return 'info';
  return '';
}

function formatAiActionPayload(action: AiAction) {
  const payload = action.payload || {};
  if (action.type === 'create_anniversary') {
    return [
      `标题：${String(payload.title || action.title || '')}`,
      `日期：${String(payload.date || payload.eventDate || '')}`,
      payload.description ? `说明：${String(payload.description)}` : '',
    ].filter(Boolean).join('\n');
  }
  if (action.type === 'create_important_moment') {
    return [
      `标题：${String(payload.title || action.title || '')}`,
      `日期：${String(payload.date || payload.eventDate || '')}`,
      payload.description ? `说明：${String(payload.description)}` : '',
    ].filter(Boolean).join('\n');
  }
  if (action.type === 'create_promise') {
    return `${String(payload.icon || '💗')} ${String(payload.text || action.title || '')}`;
  }
  if (action.type === 'draft_letter') {
    return [
      `标题：${String(payload.title || action.title || '')}`,
      payload.body ? `内容：${String(payload.body).slice(0, 120)}` : '',
    ].filter(Boolean).join('\n');
  }
  if (action.type === 'update_reminders') {
    return [
      payload.anniversaryEnabled !== undefined ? `纪念日提醒：${payload.anniversaryEnabled ? '开启' : '关闭'}` : '',
      payload.anniversaryDays !== undefined ? `提前天数：${String(payload.anniversaryDays)} 天` : '',
      payload.surpriseEnabled !== undefined ? `惊喜提醒：${payload.surpriseEnabled ? '开启' : '关闭'}` : '',
      payload.dailyQuoteEnabled !== undefined ? `每日一句：${payload.dailyQuoteEnabled ? '开启' : '关闭'}` : '',
      payload.dailyQuoteTime ? `每日一句时间：${String(payload.dailyQuoteTime)}` : '',
    ].filter(Boolean).join('\n');
  }
  return JSON.stringify(payload, null, 2);
}

async function saveAiMemoryRow(memory: AiMemory) {
  try {
    const saved = await updateAiMemory(memory.id, {
      type: memory.type,
      content: memory.content,
      confidence: memory.confidence,
    });
    Object.assign(memory, saved);
    ElMessage.success('记忆已保存');
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '记忆保存失败'));
  }
}

async function removeAiMemoryRow(memory: AiMemory) {
  try {
    await confirmDelete('确认删除这条 AI 记忆？');
    await deleteAiMemory(memory.id);
    aiMemories.value = aiMemories.value.filter((item) => item.id !== memory.id);
    ElMessage.success('记忆已删除');
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(getErrorMessage(error, '记忆删除失败'));
  }
}

async function clearAiMemoryRows() {
  try {
    await confirmDelete('确认清空所有 AI 长期记忆？');
    await clearAiMemories();
    aiMemories.value = [];
    ElMessage.success('AI 记忆已清空');
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(getErrorMessage(error, 'AI 记忆清空失败'));
  }
}

async function saveCoupleAccessSettings() {
  const name = coupleAccessForm.name.trim();
  if (!name) {
    ElMessage.warning('请填写前台登录账号');
    return;
  }
  const saved = await saveCoupleAccess({
    name,
    password: coupleAccessForm.password || undefined,
  });
  coupleAccessForm.name = saved.name;
  coupleAccessForm.password = '';
  coupleAccessForm.passwordSet = saved.passwordSet;
  ElMessage.success('前台登录账号已保存');
}

async function removeSong(item: Dashboard['songs'][number], index: number) {
  await withRowBusy('song', item, async () => {
    try {
      await confirmDelete('确认删除这首歌？');
      if (item.id) await deleteSong(item.id);
      const settingsChanged = item.id ? removeSongReferencesFromSettings(item.id) : false;
      if (settingsChanged && dashboard.value) {
        await saveSite(dashboard.value.site);
      }
      removeListItem(dashboard.value?.songs, item, index);
      ElMessage.success('歌曲已删除');
      await load();
    } catch (error) {
      if (isConfirmCancel(error)) return;
      ElMessage.error(getErrorMessage(error, '歌曲删除失败'));
    }
  });
}

function confirmDelete(message: string) {
  return ElMessageBox.confirm(message, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
}

function compressImageFile(file: File, options: { maxSize: number; quality: number }) {
  if (!file.type.startsWith('image/') || /image\/(gif|svg\+xml)/i.test(file.type)) {
    return Promise.resolve(file);
  }

  return new Promise<File>((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(file);
      image.onload = () => {
        const scale = Math.min(1, options.maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return resolve(file);
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob || blob.size >= file.size * 0.98) return resolve(file);
          const baseName = (file.name || `image-${Date.now()}`).replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', options.quality);
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

async function uploadFileToObjectStorage(file: File, options: UploadPathOptions = {}) {
  const signed = await createUploadUrl(file, options);
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Object upload failed: ${response.status}`);
  }

  return {
    objectKey: signed.objectKey,
    publicUrl: signed.publicUrl,
  };
}

async function uploadVideoPoster(file: File) {
  const poster = await videoToPosterBlob(file);
  if (!poster) return '';
  const name = file.name.replace(/\.[^.]+$/, '') || 'video';
  const posterFile = new File([poster], `${name}-poster.jpg`, { type: 'image/jpeg' });
  const uploaded = await uploadFileToObjectStorage(posterFile, { purpose: 'video-poster', folder: uploadMeta.albumTitle || '默认相册' });
  return uploaded.publicUrl;
}

function videoToPosterBlob(file: File) {
  return new Promise<Blob | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.3, video.duration || 0);
      } catch {
        capture();
      }
    };
    video.onseeked = capture;
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    function capture() {
      try {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const scale = Math.min(1, 720 / Math.max(width, height));
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.76);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    video.src = url;
  });
}

onMounted(() => {
  if (isAuthenticated.value) void load();
});
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(229, 139, 117, 0.18), transparent 28%),
    linear-gradient(135deg, #f8f2ef, #fffaf7);
}
.login-card {
  width: min(420px, 100%);
  border-radius: 8px;
  border-color: #eadfda;
}
.login-brand {
  color: #201414;
  margin-bottom: 24px;
  padding: 0;
}
.login-brand span { color: #8d7670; }
.login-button { width: 100%; margin-top: 4px; }
.shell { min-height: 100vh; background: #f7f4f1; color: #1f1717; }
.sidebar { background: #211010; color: #fff; padding: 22px 16px; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.brand-mark { width: 40px; height: 40px; border-radius: 8px; background: #e58b75; display: grid; place-items: center; font-weight: 800; }
.brand strong { display: block; font-size: 18px; }
.brand span { display: block; color: #dbc5c0; font-size: 12px; margin-top: 4px; }
.menu { border-right: 0; background: transparent; }
.menu :deep(.el-menu-item) { color: #f7eeee; border-radius: 8px; }
.menu :deep(.el-menu-item.is-active), .menu :deep(.el-menu-item:hover) { background: #3b1d20; color: #fff; }
.topbar { height: 88px; background: #fff; border-bottom: 1px solid #e8dfda; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.topbar-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
.mobile-menu-button { display: none; }
.topbar h1 { margin: 0 0 6px; font-size: 24px; }
.topbar p { margin: 0; color: #806f6a; font-size: 13px; }
.topbar-actions { display: flex; align-items: center; gap: 10px; }
.main { padding: 24px; }
.panel-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.wide { grid-column: span 4; }
.metric span { display: block; color: #806f6a; }
.metric strong { display: block; margin-top: 10px; font-size: 30px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.section-card { margin-bottom: 18px; }
.save-row { margin-top: 14px; }
.upload-actions, .inline-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.inline-actions.compact { gap: 8px; }
.inline-actions.compact .el-input { width: 96px; }
.upload-actions .el-input, .upload-actions .el-select, .upload-actions .el-date-editor { width: 150px; }
.song-upload-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.lyric-status-cell { display: flex; flex-direction: column; gap: 6px; line-height: 1.5; color: #6b5e59; }
.lyric-status-cell strong { color: #3d2f2a; font-size: 13px; }
.lyric-status-cell span { font-size: 12px; }
.inline-actions .el-input { width: min(520px, 100%); }
.inline-actions.compact .el-input { width: 96px; }
.section-tip { margin-bottom: 14px; }
.garden-table :deep(.cell) { overflow: visible; }
.garden-form-stack { display: flex; flex-direction: column; gap: 8px; }
.garden-preview {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: #f1e7e3;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 28px;
}
.garden-preview .el-image { width: 100%; height: 100%; }
.linked-assets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.asset-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.asset-card {
  border: 1px solid #eadfda;
  border-radius: 8px;
  padding: 10px;
  background: #fffaf7;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.asset-card:hover {
  border-color: #e58b75;
  box-shadow: 0 8px 22px rgba(74, 34, 34, 0.12);
  transform: translateY(-1px);
}
.asset-card img,
.asset-placeholder {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  object-fit: cover;
  background: #2a1518;
  color: #f7eeee;
  display: grid;
  place-items: center;
  font-size: 12px;
  letter-spacing: 0;
  margin-bottom: 8px;
}
.asset-card strong,
.asset-card span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-card span {
  color: #806f6a;
  font-size: 12px;
  margin-top: 4px;
}
.snippet-box {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eadfda;
}
.code-editor-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}
.code-editor-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  min-height: 520px;
}
.code-file-panel,
.code-file-editor {
  border: 1px solid #eadfda;
  border-radius: 8px;
  padding: 14px;
  background: #fffaf7;
}
.code-entry-select {
  width: 100%;
  margin-bottom: 12px;
}
.code-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow: auto;
  margin-bottom: 12px;
}
.code-file-item {
  border: 1px solid #eadfda;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  color: #2b1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  text-align: left;
}
.code-file-item.active {
  border-color: #e58b75;
  background: #f8e7e5;
}
.code-file-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.code-file-item small {
  color: #806f6a;
  flex: 0 0 auto;
}
.code-new-file {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.code-upload-button {
  width: 100%;
  margin-top: 8px;
}
.visually-hidden-file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.asset-file-detail {
  display: grid;
  gap: 12px;
}
.asset-file-detail .asset-placeholder {
  width: 180px;
  margin-bottom: 0;
}
.asset-file-detail p {
  margin: 0;
  color: #806f6a;
}
.page-header-configs { display: flex; flex-direction: column; gap: 12px; }
.page-header-config {
  display: grid;
  grid-template-columns: 90px minmax(180px, 1fr) minmax(220px, 1.2fr) minmax(320px, 1.4fr);
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebe1dd;
  border-radius: 8px;
}
.page-header-config .inline-actions { flex-wrap: nowrap; }
.page-header-config .inline-actions .el-input { width: min(420px, 100%); }
.tiny-preview { width: 76px; height: 44px; border-radius: 6px; background: #f3eeeb; flex: 0 0 auto; }
.entrance-preview { width: 52px; height: 52px; border-radius: 999px; background: #f3eeeb; flex: 0 0 auto; overflow: hidden; }
.profile-row { display: grid; grid-template-columns: 80px 100px 1fr 1fr; gap: 12px; align-items: center; margin-bottom: 18px; }
.profile-row .el-form-item:last-child { grid-column: 3 / span 2; }
.album-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.album-card { border: 1px solid #ebe1dd; border-radius: 8px; overflow: hidden; background: #fff; }
.album-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
.album-card video { width: 100%; height: 160px; object-fit: cover; display: block; background: #160b0b; }
.album-card div { padding: 12px; }
.album-card strong, .album-card span { display: block; }
.album-card span { color: #806f6a; font-size: 13px; margin: 6px 0; }
.theme-form { max-width: 760px; }
.form-hint { margin-left: 10px; color: #8a8f98; font-size: 12px; }
.ai-action-preview {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #5c4b45;
  font: inherit;
}
.mobile-card-list { display: none; }
.mobile-edit-card {
  border: 1px solid #eadfda;
  border-radius: 8px;
  padding: 12px;
  background: #fffaf7;
}
.mobile-edit-card__title {
  color: #3d2f2a;
  font-size: 14px;
  font-weight: 700;
}
.mobile-edit-card label {
  display: grid;
  gap: 6px;
  color: #806f6a;
  font-size: 12px;
}
.mobile-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #806f6a;
  font-size: 13px;
}
.mobile-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 980px) {
  .panel-grid { grid-template-columns: 1fr 1fr; }
  .wide { grid-column: span 2; }
  .profile-row { grid-template-columns: 1fr; }
  .profile-row .el-form-item:last-child { grid-column: auto; }
  .page-header-config { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  :global(body) {
    overflow-x: hidden;
  }

  .login-shell {
    padding: 16px;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
  }

  .login-button {
    min-height: 42px;
  }

  .shell {
    display: block;
  }

  .sidebar {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
    min-height: 40px;
    flex: 0 0 auto;
  }

  .topbar {
    height: auto;
    min-height: 64px;
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 12px 14px;
  }

  .topbar-title {
    align-items: flex-start;
  }

  .topbar h1 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .topbar p {
    font-size: 12px;
    line-height: 1.5;
  }

  .topbar-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .topbar-actions .el-button {
    min-height: 40px;
  }

  .main {
    padding: 12px;
  }

  .panel-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .wide {
    grid-column: span 1;
  }

  .metric strong {
    font-size: 24px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .card-header .inline-actions {
    width: 100%;
  }

  .upload-actions,
  .inline-actions,
  .song-upload-actions {
    display: grid;
    grid-template-columns: 1fr !important;
    width: 100%;
  }

  .inline-actions.compact .el-input,
  .inline-actions .el-input,
  .upload-actions .el-input,
  .upload-actions .el-select,
  .upload-actions .el-date-editor {
    width: 100%;
  }

  .page-header-config .inline-actions {
    flex-wrap: wrap;
  }

  .tiny-preview,
  .entrance-preview {
    flex: 0 0 auto;
  }

  .el-form-item {
    display: block;
  }

  :deep(.el-form-item__label) {
    display: block;
    width: auto !important;
    height: auto;
    line-height: 1.4;
    margin-bottom: 6px;
    text-align: left;
  }

  :deep(.el-form-item__content) {
    display: block;
    margin-left: 0 !important;
  }

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-date-editor),
  :deep(.el-input-number),
  :deep(.el-textarea) {
    width: 100% !important;
  }

  :deep(.el-button) {
    min-height: 40px;
    white-space: normal;
  }

  :deep(.el-card) {
    border-radius: 8px;
  }

  :deep(.el-card__body),
  :deep(.el-card__header) {
    padding: 14px;
  }

  :deep(.el-table) {
    width: 100%;
  }

  :deep(.el-table__body-wrapper),
  :deep(.el-table__header-wrapper) {
    overflow-x: auto;
  }

  :deep(.el-table .el-input),
  :deep(.el-table .el-select),
  :deep(.el-table .el-date-editor) {
    min-width: 140px;
  }

  .desktop-editor-table {
    display: none;
  }

  .mobile-card-list {
    display: grid;
    gap: 12px;
  }

  .mobile-edit-card {
    display: grid;
    gap: 12px;
  }

  .mobile-card-actions {
    grid-template-columns: 1fr;
  }

  .album-grid,
  .asset-picker-grid {
    grid-template-columns: 1fr;
  }

  .code-editor-layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .code-file-list {
    max-height: 180px;
  }

  .asset-file-detail .asset-placeholder {
    width: 100%;
  }
}

:global(.mobile-menu-drawer .el-drawer__body) {
  padding: 0 14px 16px;
}

:global(.mobile-menu) {
  border-right: 0;
}

:global(.mobile-menu .el-menu-item) {
  border-radius: 8px;
}

@media (max-width: 768px) {
  :global(.el-dialog) {
    width: calc(100vw - 24px) !important;
    margin: 12px auto !important;
  }

  :global(.el-dialog__body) {
    max-height: calc(100vh - 170px);
    overflow-y: auto;
  }
}
</style>

