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
      <el-menu :default-active="active" class="menu" @select="active = $event">
        <el-menu-item index="dashboard">仪表盘</el-menu-item>
        <el-menu-item index="home">首页</el-menu-item>
        <el-menu-item index="profile">资料</el-menu-item>
        <el-menu-item index="anniversary">纪念日</el-menu-item>
        <el-menu-item index="album">相册</el-menu-item>
        <el-menu-item index="letter">情书</el-menu-item>
        <el-menu-item index="music">音乐</el-menu-item>
        <el-menu-item index="romance">心动花园</el-menu-item>
        <el-menu-item index="theme">主题</el-menu-item>
        <el-menu-item index="privacy">隐私提醒</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>这里保存的数据会被前台页面读取。保存后前台会自动同步，也可以手动刷新。</p>
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
                <el-button type="primary" @click="addMoment">新增</el-button>
              </div>
              <el-table :data="dashboard.site.settings.moments" row-key="id">
                <el-table-column label="标题" min-width="180">
                  <template #default="{ row }"><el-input v-model="row.title" /></template>
                </el-table-column>
                <el-table-column label="日期" width="190">
                  <template #default="{ row }"><el-date-picker v-model="row.date" type="datetime" value-format="YYYY-MM-DDTHH:mm" format="YYYY-MM-DD HH:mm" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removeMoment($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
              <el-divider />
              <div class="card-header">
                <strong>未来约定</strong>
                <el-button type="primary" @click="addPromise">新增</el-button>
              </div>
              <el-table :data="dashboard.site.settings.promises" row-key="id">
                <el-table-column label="图标" width="100">
                  <template #default="{ row }"><el-input v-model="row.icon" /></template>
                </el-table-column>
                <el-table-column label="内容" min-width="260">
                  <template #default="{ row }"><el-input v-model="row.text" /></template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ $index }"><el-button link type="danger" @click="removePromise($index)">删除</el-button></template>
                </el-table-column>
              </el-table>
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
                <el-form-item label="头像地址"><el-input v-model="profile.avatarUrl" /></el-form-item>
              </div>
              <el-button type="primary" @click="saveProfileAndSite">保存资料</el-button>
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
                <strong>今日小语</strong>
                <el-button type="primary" @click="addDailyQuote">新增小语</el-button>
              </div>
              <el-table :data="dashboard.site.settings.anniversaryPage.dailyQuotes" row-key="id">
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
              <el-button type="primary" class="save-row" @click="saveAnniversaryPage">保存页面配置</el-button>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <template #header><div class="card-header"><span>纪念日管理</span><el-button type="primary" @click="addAnniversary">新增纪念日</el-button></div></template>
            <el-table :data="dashboard.anniversaries" row-key="id">
              <el-table-column label="标题" min-width="150"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
              <el-table-column label="日期" width="180"><template #default="{ row }"><el-date-picker v-model="row.eventDate" type="datetime" value-format="YYYY-MM-DDTHH:mm" format="YYYY-MM-DD HH:mm" /></template></el-table-column>
              <el-table-column label="每年重复" width="110"><template #default="{ row }"><el-switch v-model="row.repeatYearly" /></template></el-table-column>
              <el-table-column label="倒计时" width="100"><template #default="{ row }"><el-switch v-model="row.showCountdown" /></template></el-table-column>
              <el-table-column label="说明" min-width="220"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
              <el-table-column label="操作" width="150" fixed="right"><template #default="{ row, $index }"><el-button link type="primary" @click="saveOneAnniversary(row)">保存</el-button><el-button link type="danger" @click="removeAnniversary(row, $index)">删除</el-button></template></el-table-column>
            </el-table>
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
                  <el-button link type="primary" @click="openAlbumEditor(item)">编辑</el-button>
                  <el-button link type="danger" @click="removeAlbumItem(item.id)">删除</el-button>
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
              <el-button @click="albumEditor.visible = false">取消</el-button>
              <el-button type="primary" @click="saveAlbumEditor">保存</el-button>
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
                    <el-button type="primary" @click="saveOneLetter(letter)">保存</el-button>
                    <el-button type="danger" @click="removeLetter(letter, index)">删除</el-button>
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
              <el-table-column label="上传" width="180"><template #default="{ row }"><div class="song-upload-actions"><el-upload :show-file-list="false" accept="audio/mpeg,audio/mp3,.mp3" :http-request="(options: UploadRequestOptions) => uploadSongAudio(options, row)"><el-button size="small">上传MP3</el-button></el-upload><el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadSongCover(options, row)"><el-button size="small">封面</el-button></el-upload></div></template></el-table-column>
              <el-table-column label="歌词片段" min-width="220"><template #default="{ row }"><el-input v-model="row.lyric" /></template></el-table-column>
              <el-table-column label="收藏" width="90"><template #default="{ row }"><el-switch v-model="row.favorite" /></template></el-table-column>
              <el-table-column label="操作" width="150" fixed="right"><template #default="{ row, $index }"><el-button link type="primary" @click="saveOneSong(row)">保存</el-button><el-button link type="danger" @click="removeSong(row, $index)">删除</el-button></template></el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never" class="section-card">
            <template #header><div class="card-header"><span>心情歌单</span><el-button type="primary" @click="addMoodPlaylist">新增歌单</el-button></div></template>
            <el-table :data="dashboard.site.settings.music.moodPlaylists" row-key="id">
              <el-table-column label="歌单名" min-width="160"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
              <el-table-column label="描述" min-width="220"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
              <el-table-column label="封面地址" min-width="220"><template #default="{ row }"><el-input v-model="row.coverUrl" /></template></el-table-column>
              <el-table-column label="歌曲" min-width="320">
                <template #default="{ row }">
                  <el-select v-model="row.songIds" multiple filterable placeholder="选择歌曲">
                    <el-option v-for="song in dashboard.songs" :key="song.id || song.title" :label="`${song.title} - ${song.artist || '未填歌手'}`" :value="song.id" :disabled="!song.id" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140"><template #default="{ $index }"><el-button link type="primary" @click="saveMusicSettings">保存</el-button><el-button link type="danger" @click="removeMoodPlaylist($index)">删除</el-button></template></el-table-column>
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
              title="心动花园目前只展示 HTML：可以上传单文件 HTML，或把整套 HTML 项目放进爱心代码合集后填写 /heart-garden/... 地址。"
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
                        <el-button size="small">上传HTML</el-button>
                      </el-upload>
                      <el-upload :show-file-list="false" accept="image/*" :http-request="(options: UploadRequestOptions) => uploadHeartGardenCover(options, row)">
                        <el-button size="small">封面</el-button>
                      </el-upload>
                      <el-tag v-if="row.content" type="success">已上传HTML</el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row, $index }">
                  <el-button link type="primary" @click="moveHeartGardenProject($index, -1)">上移</el-button>
                  <el-button link type="primary" @click="moveHeartGardenProject($index, 1)">下移</el-button>
                  <el-button link type="danger" @click="removeHeartGardenProject(row, $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="save-row">
              <el-button type="primary" @click="saveHeartGarden">保存心动花园</el-button>
            </div>
          </el-card>
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
  clearAdminToken,
  completeMediaUpload,
  createUploadUrl,
  deleteAlbumItem,
  deleteAnniversary,
  deleteLetter,
  deleteSong,
  fetchCoupleAccess,
  fetchDashboard,
  getAdminToken,
  loginAdmin,
  saveAnniversary,
  saveCoupleAccess,
  saveLetter,
  saveProfiles,
  saveSite,
  saveSong,
  saveTheme,
  updateAlbumItem,
} from './api';

const active = ref('dashboard');
const loading = ref(false);
const loginLoading = ref(false);
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
const pageHeaderKeys = [
  { key: 'home', label: '首页' },
  { key: 'anniversary', label: '纪念日' },
  { key: 'album', label: '相册' },
  { key: 'music', label: '音乐' },
  { key: 'settings', label: '设置页' },
] as const;
type PageHeaderKey = (typeof pageHeaderKeys)[number]['key'];
type HeartGardenProject = Dashboard['site']['settings']['heartGarden']['projects'][number];
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

const pageTitle = computed(() => ({
  dashboard: '仪表盘',
  home: '首页管理',
  profile: '资料管理',
  anniversary: '纪念日管理',
  album: '相册管理',
  letter: '情书管理',
  music: '音乐管理',
  romance: '心动花园',
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

const albumCategories = computed(() => {
  const values = new Set(['默认相册', '旅行', '日常', '约会', '夜晚']);
  dashboard.value?.albumItems.forEach((item) => values.add(item.album));
  return [...values];
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
    const [nextDashboard, coupleAccess] = await Promise.all([
      fetchDashboard(),
      fetchCoupleAccess(),
    ]);
    dashboard.value = nextDashboard;
    coupleAccessForm.name = coupleAccess.name || 'love';
    coupleAccessForm.password = '';
    coupleAccessForm.passwordSet = coupleAccess.passwordSet;
    dashboard.value.anniversaries ||= [];
    dashboard.value.songs ||= [];
    dashboard.value.letters ||= [];
    dashboard.value.albumItems ||= [];
    dashboard.value.profiles ||= [];
    ensurePageHeaders();
    ensureMusicSettings();
    ensurePrivacyReminderSettings();
    ensureCoupleEntranceSettings();
    ensureHeartGardenSettings();
    dashboard.value.site.settings.anniversaryPage.firstMeetDate ||= '2024-08-14T00:00';
    dashboard.value.site.settings.anniversaryPage.showCountdown ??= true;
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
    settings: {
      title: '把这份浪漫，调成我们喜欢的样子',
      subtitle: '主题、音乐、纪念日和相册，都可以在这里慢慢定制。',
      imageUrl: 'https://images.unsplash.com/photo-1517534573028-3db0dab0d31c?auto=format&fit=crop&w=640&q=80',
    },
  };
  dashboard.value.site.settings.pageHeaders = {
    ...defaults,
    ...(dashboard.value.site.settings.pageHeaders || {}),
  };
}

function pageHeader(key: PageHeaderKey) {
  const current = dashboard.value;
  if (!current) throw new Error('Dashboard is not loaded');
  if (!current.site.settings.pageHeaders?.[key]) ensurePageHeaders();
  return current.site.settings.pageHeaders[key];
}

async function saveHome() {
  if (!dashboard.value) return;
  await saveSite(dashboard.value.site);
  ElMessage.success('首页内容已保存，前台会自动同步');
}

async function saveProfileAndSite() {
  if (!dashboard.value) return;
  await saveSite(dashboard.value.site);
  await saveProfiles(dashboard.value.profiles);
  ElMessage.success('资料已保存，前台会自动同步');
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
    const { publicUrl: backgroundUrl } = await uploadFileToObjectStorage(file);
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
  dashboard.value?.site.settings.promises.push({ id: `promise-${Date.now()}`, icon: '❤️', text: '新的未来约定' });
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

async function saveAnniversaryPage() {
  if (!dashboard.value) return;
  await saveSite(dashboard.value.site);
  ElMessage.success('纪念日页面配置已保存，前台会自动同步');
}

async function uploadAboutImage(options: UploadRequestOptions) {
  if (!dashboard.value) return;
  try {
    const file = await compressImageFile(options.file, { maxSize: 1600, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file);
    dashboard.value.site.settings.aboutImageUrl = publicUrl;
    dashboard.value.site.settings.aboutImageVisible = true;
    await saveHome();
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('About 图片上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadPageHeaderImage(options: UploadRequestOptions, pageKey: PageHeaderKey) {
  if (!dashboard.value) return;
  try {
    ensurePageHeaders();
    const file = await compressImageFile(options.file, { maxSize: 2200, quality: 0.88 });
    const { publicUrl } = await uploadFileToObjectStorage(file);
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
  const saved = await saveAnniversary(item);
  item.id = saved.id;
  ElMessage.success('纪念日已保存');
  await load();
}

async function removeAnniversary(item: Dashboard['anniversaries'][number], index: number) {
  await confirmDelete('确认删除这个纪念日？');
  if (item.id) await deleteAnniversary(item.id);
  dashboard.value?.anniversaries.splice(index, 1);
  ElMessage.success('纪念日已删除');
  await load();
}

async function uploadAvatar(options: UploadRequestOptions, profile: Dashboard['profiles'][number]) {
  try {
    const file = await compressImageFile(options.file, { maxSize: 600, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file);
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
    const uploaded = await uploadFileToObjectStorage(uploadFile);
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

async function removeAlbumItem(id: string) {
  await confirmDelete('确认删除这张照片？');
  await deleteAlbumItem(id);
  ElMessage.success('照片已删除');
  await load();
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
}

function addLetter() {
  dashboard.value?.letters.unshift({
    id: '',
    title: '新的情书',
    body: '',
    signature: '',
    letterDate: new Date().toISOString().slice(0, 10),
    status: 'PUBLISHED',
  });
}

async function saveOneLetter(item: Dashboard['letters'][number]) {
  const saved = await saveLetter(item);
  item.id = saved.id;
  ElMessage.success('情书已保存');
  await load();
}

async function removeLetter(item: Dashboard['letters'][number], index: number) {
  await confirmDelete('确认删除这封情书？');
  if (item.id) await deleteLetter(item.id);
  dashboard.value?.letters.splice(index, 1);
  ElMessage.success('情书已删除');
  await load();
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

async function saveOneSong(item: Dashboard['songs'][number]) {
  const saved = await saveSong(item);
  item.id = saved.id;
  ElMessage.success('歌曲已保存');
  await load();
}

async function uploadSongAudio(options: UploadRequestOptions, item: Dashboard['songs'][number]) {
  try {
    const file = options.file;
    if (!file.type.includes('mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      ElMessage.error('请上传 MP3 文件');
      options.onError?.(new Error('Only MP3 is supported') as never);
      return;
    }
    const { publicUrl } = await uploadFileToObjectStorage(file);
    item.audioUrl = publicUrl;
    if (!item.title || item.title === '新的歌曲') item.title = file.name.replace(/\.[^.]+$/, '');
    if (!item.duration) item.duration = await getAudioDuration(file);
    await saveOneSong(item);
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('MP3 上传失败，请确认 R2 环境变量和跨域规则已配置');
    options.onError?.(error as never);
  }
}

async function uploadSongCover(options: UploadRequestOptions, item: Dashboard['songs'][number]) {
  try {
    const file = await compressImageFile(options.file, { maxSize: 800, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file);
    item.coverUrl = publicUrl;
    await saveOneSong(item);
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('封面上传失败');
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
  await confirmDelete('确认删除这个心动花园项目？');
  dashboard.value?.site.settings.heartGarden.projects.splice(index, 1);
}

async function uploadHeartGardenCover(options: UploadRequestOptions, item: HeartGardenProject) {
  try {
    const file = await compressImageFile(options.file, { maxSize: 1200, quality: 0.86 });
    const { publicUrl } = await uploadFileToObjectStorage(file);
    item.cover = publicUrl;
    options.onSuccess?.({});
  } catch (error) {
    ElMessage.error('封面上传失败');
    options.onError?.(error as never);
  }
}

async function uploadHeartGardenHtml(options: UploadRequestOptions, item: HeartGardenProject) {
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
    item.content = await fileToText(file);
    item.url = '';
    item.type = 'html';
    item.group ||= 'custom';
    item.status = 'ready';
    if (!item.title || item.title === '新的心动项目') item.title = file.name.replace(/\.[^.]+$/, '');
    options.onSuccess?.({});
    ElMessage.success('HTML 已读入，保存后前台可预览');
  } catch (error) {
    ElMessage.error('HTML 上传失败');
    options.onError?.(error as never);
  }
}

async function saveHeartGarden() {
  if (!dashboard.value) return;
  ensureHeartGardenSettings();
  await saveSite(dashboard.value.site);
  ElMessage.success('心动花园已保存，前台会自动同步');
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

function removeMoodPlaylist(index: number) {
  dashboard.value?.site.settings.music.moodPlaylists.splice(index, 1);
}

async function saveMusicSettings() {
  if (!dashboard.value) return;
  ensureMusicSettings();
  await saveSite(dashboard.value.site);
  ElMessage.success('音乐设置已保存，前台会自动同步');
}

async function savePrivacyAndReminders() {
  if (!dashboard.value) return;
  ensurePrivacyReminderSettings();
  ensureCoupleEntranceSettings();
  await saveSite(dashboard.value.site);
  ElMessage.success('隐私与提醒已保存，前台会自动同步');
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
  await confirmDelete('确认删除这首歌？');
  if (item.id) await deleteSong(item.id);
  dashboard.value?.songs.splice(index, 1);
  ElMessage.success('歌曲已删除');
  await load();
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

async function uploadFileToObjectStorage(file: File) {
  const signed = await createUploadUrl(file);
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
  const uploaded = await uploadFileToObjectStorage(posterFile);
  return uploaded.publicUrl;
}

function fileToText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  });
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
@media (max-width: 980px) {
  .panel-grid { grid-template-columns: 1fr 1fr; }
  .wide { grid-column: span 2; }
  .profile-row { grid-template-columns: 1fr; }
  .profile-row .el-form-item:last-child { grid-column: auto; }
  .page-header-config { grid-template-columns: 1fr; }
}
</style>

