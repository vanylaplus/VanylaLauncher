/**
 * Script for landing.ejs
 */
// Requirements
const { URL }                 = require('url')
const {
    MojangRestAPI,
    getServerStatus
}                             = require('helios-core/mojang')
const {
    RestResponseStatus,
    isDisplayableError,
    validateLocalFile
}                             = require('helios-core/common')
const {
    FullRepair,
    DistributionIndexProcessor,
    MojangIndexProcessor,
    downloadFile
}                             = require('helios-core/dl')
const {
    validateSelectedJvm,
    ensureJavaDirIsRoot,
    javaExecFromRoot,
    discoverBestJvmInstallation,
    latestOpenJDK,
    extractJdk
}                             = require('helios-core/java')

// Internal Requirements
const DiscordWrapper          = require('./assets/js/discordwrapper')
const ProcessBuilder          = require('./assets/js/processbuilder')

// Launch Elements
const launch_content          = document.getElementById('launch_content')
const launch_details          = document.getElementById('launch_details')
const launch_progress         = document.getElementById('launch_progress')
const launch_progress_label   = document.getElementById('launch_progress_label')
const launch_details_text     = document.getElementById('launch_details_text')
const server_selection_button = document.getElementById('server_selection_button')
const user_text               = document.getElementById('user_text')

const loggerLanding = LoggerUtil.getLogger('Landing')

/* FAQ Accordion Functions */
function toggleFaqAnswer(element) {
    const answer = element.nextElementSibling
    const isHidden = answer.style.display === 'none' || answer.style.display === ''
    
    answer.style.display = isHidden ? 'block' : 'none'
    element.style.background = isHidden ? 'rgba(120,120,120,0.2)' : 'rgba(120,120,120,0.1)'
    
    // Rotate the arrow
    const arrow = element.querySelector('span:last-child')
    if(arrow) {
        arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)'
    }
}

/* Launch Progress Wrapper Functions */

/**
 * Show/hide the loading area.
 * 
 * @param {boolean} loading True if the loading area should be shown, otherwise false.
 */
function toggleLaunchArea(loading){
    if(loading){
        launch_details.style.display = 'flex'
        launch_content.style.display = 'none'
    } else {
        // Simply hide the loading area, no fade
        launch_details.style.display = 'none'
        launch_content.style.display = 'inline-flex'
    }
}

/**
 * Set the details text of the loading area.
 * 
 * @param {string} details The new text for the loading details.
 */
function setLaunchDetails(details){
    launch_details_text.innerHTML = details
}

/**
 * Set the value of the loading progress bar and display that value.
 * 
 * @param {number} percent Percentage (0-100)
 */
function setLaunchPercentage(percent){
    launch_progress.setAttribute('max', 100)
    launch_progress.setAttribute('value', percent)
    launch_progress_label.innerHTML = percent + '%'
}

/**
 * Set the value of the OS progress bar and display that on the UI.
 * 
 * @param {number} percent Percentage (0-100)
 */
function setDownloadPercentage(percent){
    remote.getCurrentWindow().setProgressBar(percent/100)
    setLaunchPercentage(percent)
}

/**
 * Set the overall progress with phase tracking.
 * Converts phase progress (0-100) to overall progress (0-100).
 * 
 * @param {number} phaseProgress Current phase progress (0-100)
 * @param {number} phaseStart Overall start percentage for this phase
 * @param {number} phaseEnd Overall end percentage for this phase
 */
function setOverallProgress(phaseProgress, phaseStart, phaseEnd){
    const overallPercent = Math.round(phaseStart + ((phaseEnd - phaseStart) * (phaseProgress / 100)))
    setLaunchPercentage(Math.min(overallPercent, 100))
    remote.getCurrentWindow().setProgressBar(Math.min(overallPercent, 100) / 100)
}

/**
 * Enable or disable the launch button.
 * 
 * @param {boolean} val True to enable, false to disable.
 */
function setLaunchEnabled(val){
    document.getElementById('launch_button').disabled = !val
}

// Bind launch button
const _launchBtn = document.getElementById('launch_button')
if(_launchBtn){
    _launchBtn.addEventListener('click', async e => {
    loggerLanding.info('Launching game..')
    try {
        const server = (await DistroAPI.getDistribution()).getServerById(ConfigManager.getSelectedServer())
        const jExe = ConfigManager.getJavaExecutable(ConfigManager.getSelectedServer())
        if(jExe == null){
            await asyncSystemScan(server.effectiveJavaOptions)
        } else {

            setLaunchDetails(Lang.queryJS('landing.launch.pleaseWait'))
            toggleLaunchArea(true)
            setLaunchPercentage(0, 100)

            const details = await validateSelectedJvm(ensureJavaDirIsRoot(jExe), server.effectiveJavaOptions.supported)
            if(details != null){
                loggerLanding.info('Jvm Details', details)
                await dlAsync()

            } else {
                await asyncSystemScan(server.effectiveJavaOptions)
            }
        }
    } catch(err) {
        loggerLanding.error('Unhandled error in during launch process.', err)
        showLaunchFailure(Lang.queryJS('landing.launch.failureTitle'), Lang.queryJS('landing.launch.failureText'))
    }
    })
}

// Bind settings button
document.getElementById('sidebarSettings').onclick = async e => {
    await prepareSettings()
    switchView(getCurrentView(), VIEWS.settings)
}

// Bind CGU button
const cguBtn = document.getElementById('sidebarCGU')
if(cguBtn) {
    cguBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.cgu)
    }
}

// Bind CGU sidebar buttons (News and Info buttons on CGU page)
const cguNewsBtn = document.getElementById('cguSidebarNews')
if(cguNewsBtn) {
    cguNewsBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.landing)
    }
}

// Bind CGU button on CGU page
const cguSidebarCGUBtn = document.getElementById('cguSidebarCGU')
if(cguSidebarCGUBtn) {
    cguSidebarCGUBtn.onclick = e => {
        if(getCurrentView() !== VIEWS.cgu) {
            switchView(getCurrentView(), VIEWS.cgu)
        }
    }
}

// Bind CGU sidebar home button
const cguSidebarHomeBtn = document.getElementById('cguSidebarHome')
if(cguSidebarHomeBtn) {
    cguSidebarHomeBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.landing)
    }
}

// Bind CGU sidebar news button
const cguSidebarNewsBtn = document.getElementById('cguSidebarNews')
if(cguSidebarNewsBtn) {
    cguSidebarNewsBtn.onclick = e => {
        // News button on CGU page - add functionality if needed
    }
}

// Bind Help button
const helpBtn = document.getElementById('sidebarHelp')
if(helpBtn) {
    helpBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.help)
    }
}

// Bind Help sidebar buttons on Help page
const helpSidebarCGUBtn = document.getElementById('helpSidebarCGU')
if(helpSidebarCGUBtn) {
    helpSidebarCGUBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.cgu)
    }
}

// Bind Help button on Help page
const helpSidebarHelpBtn = document.getElementById('helpSidebarHelp')
if(helpSidebarHelpBtn) {
    helpSidebarHelpBtn.onclick = e => {
        if(getCurrentView() !== VIEWS.help) {
            switchView(getCurrentView(), VIEWS.help)
        }
    }
}

// Bind Help sidebar home button
const helpSidebarHomeBtn = document.getElementById('helpSidebarHome')
if(helpSidebarHomeBtn) {
    helpSidebarHomeBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.landing)
    }
}

// Bind Help sidebar news button
const helpSidebarNewsBtn = document.getElementById('helpSidebarNews')
if(helpSidebarNewsBtn) {
    helpSidebarNewsBtn.onclick = e => {
        // News button on Help page - add functionality if needed
    }
}

// Bind Wheel button in sidebar (all pages)
const sidebarWheel = document.getElementById('sidebarWheel')
if(sidebarWheel) {
    sidebarWheel.onclick = e => {
        switchView(getCurrentView(), VIEWS.wheel)
    }
}

const helpSidebarWheel = document.getElementById('helpSidebarWheel')
if(helpSidebarWheel) {
    helpSidebarWheel.onclick = e => {
        switchView(getCurrentView(), VIEWS.wheel)
    }
}

const cguSidebarWheel = document.getElementById('cguSidebarWheel')
if(cguSidebarWheel) {
    cguSidebarWheel.onclick = e => {
        switchView(getCurrentView(), VIEWS.wheel)
    }
}

const wheelSidebarSettings = document.getElementById('wheelSidebarSettings')
if(wheelSidebarSettings) {
    wheelSidebarSettings.onclick = async e => {
        await prepareSettings()
        switchView(getCurrentView(), VIEWS.settings)
    }
}

// Bind Wheel sidebar home button
const wheelSidebarHomeBtn = document.getElementById('wheelSidebarHome')
if(wheelSidebarHomeBtn) {
    wheelSidebarHomeBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.landing)
    }
}

// Bind Wheel sidebar help button
const wheelSidebarHelpBtn = document.getElementById('wheelSidebarHelp')
if(wheelSidebarHelpBtn) {
    wheelSidebarHelpBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.help)
    }
}

// Bind Wheel sidebar CGU button
const wheelSidebarCGUBtn = document.getElementById('wheelSidebarCGU')
if(wheelSidebarCGUBtn) {
    wheelSidebarCGUBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.cgu)
    }
}

// Bind Help sidebar settings button
const helpSidebarSettingsBtn = document.getElementById('helpSidebarSettings')
if(helpSidebarSettingsBtn) {
    helpSidebarSettingsBtn.onclick = async e => {
        await prepareSettings()
        switchView(getCurrentView(), VIEWS.settings)
    }
}

// Bind CGU sidebar settings button
const cguSidebarSettingsBtn = document.getElementById('cguSidebarSettings')
if(cguSidebarSettingsBtn) {
    cguSidebarSettingsBtn.onclick = async e => {
        await prepareSettings()
        switchView(getCurrentView(), VIEWS.settings)
    }
}

// Bind CGU sidebar help button
const cguSidebarHelpBtn = document.getElementById('cguSidebarHelp')
if(cguSidebarHelpBtn) {
    cguSidebarHelpBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.help)
    }
}

const cguBackBtn = document.getElementById('cguBackButton')
if(cguBackBtn) {
    cguBackBtn.onclick = e => {
        switchView(getCurrentView(), VIEWS.landing)
    }
}

// (Supprime l'ancien binding settingsMediaButton)
const _settingsBtn = document.getElementById('settingsMediaButton')
if(_settingsBtn){
    _settingsBtn.onclick = null
}

// Bind avatar overlay button.
const _avatarOverlay = document.getElementById('avatarOverlay')
if(_avatarOverlay){
    _avatarOverlay.onclick = async e => {
        await prepareSettings()
        switchView(getCurrentView(), VIEWS.settings, 500, 500, () => {
            settingsNavItemListener(document.getElementById('settingsNavAccount'), false)
        })
    }
}

// Bind selected account
function updateSelectedAccount(authUser){
    let username = Lang.queryJS('landing.selectedAccount.noAccountSelected')
    let lastLoginText = ''
    if(authUser != null){
        if(authUser.displayName != null){
            username = authUser.displayName
        }
        // Get or initialize lastLogin
        let lastLoginTime = authUser.lastLogin || new Date().getTime()
        const now = new Date().getTime()
        const diff = now - lastLoginTime
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (seconds < 60) lastLoginText = 'À l\'instant'
        else if (minutes < 60) lastLoginText = `Il y a ${minutes}m`
        else if (hours < 24) lastLoginText = `Il y a ${hours}h`
        else if (days < 7) lastLoginText = `Il y a ${days}j`
        else {
            const date = new Date(lastLoginTime)
            lastLoginText = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
        }
        
        if(authUser.uuid != null){
            // Update ALL avatars using class selector
            const avatars = document.querySelectorAll('.profile-avatar')
            avatars.forEach(avatar => {
                avatar.style.backgroundImage = `url('https://mc-heads.net/body/${authUser.uuid}/right')`
            })
        }
    }
    // Update ALL usernames using class selector
    const userNames = document.querySelectorAll('.profile-name')
    userNames.forEach(elem => {
        elem.innerHTML = username
    })
    
    // Update ALL token balances using TokenManager
    if(authUser.uuid != null && typeof TokenManager_Instance !== 'undefined') {
        const balance = TokenManager_Instance.getBalance(authUser.uuid)
        const balanceElements = document.querySelectorAll('.tokens-balance')
        balanceElements.forEach(elem => {
            elem.textContent = balance.toString()
        })
    }
}
updateSelectedAccount(ConfigManager.getSelectedAccount())

// Listen to token balance updates
if(typeof TokenManager_Instance !== 'undefined') {
    TokenManager_Instance.onUpdate(({uuid, balance}) => {
        const authUser = ConfigManager.getSelectedAccount()
        if(authUser && authUser.uuid === uuid) {
            const balanceElements = document.querySelectorAll('.tokens-balance')
            balanceElements.forEach(elem => {
                elem.textContent = balance.toString()
            })
        }
    })
}

// Bind selected server
function updateSelectedServer(serv){
    if(getCurrentView() === VIEWS.settings){
        fullSettingsSave()
    }
    ConfigManager.setSelectedServer(serv != null ? serv.rawServer.id : null)
    ConfigManager.save()
    server_selection_button.innerHTML = '&#8226; ' + (serv != null ? serv.rawServer.name : Lang.queryJS('landing.noSelection'))
    if(getCurrentView() === VIEWS.settings){
        animateSettingsTabRefresh()
    }
    setLaunchEnabled(serv != null)
}
// Real text is set in uibinder.js on distributionIndexDone.
server_selection_button.innerHTML = '&#8226; ' + Lang.queryJS('landing.selectedServer.loading')
server_selection_button.onclick = async e => {
    e.target.blur()
    await toggleServerSelection(true)
}

// Update Mojang Status Color
const refreshMojangStatuses = async function(){
    loggerLanding.info('Refreshing Mojang Statuses..')

    let status = 'grey'
    let tooltipEssentialHTML = ''
    let tooltipNonEssentialHTML = ''

    const response = await MojangRestAPI.status()
    let statuses
    if(response.responseStatus === RestResponseStatus.SUCCESS) {
        statuses = response.data
    } else {
        loggerLanding.warn('Unable to refresh Mojang service status.')
        statuses = MojangRestAPI.getDefaultStatuses()
    }
    
    greenCount = 0
    greyCount = 0

    for(let i=0; i<statuses.length; i++){
        const service = statuses[i]

        const tooltipHTML = `<div class="mojangStatusContainer">
            <span class="mojangStatusIcon" style="color: ${MojangRestAPI.statusToHex(service.status)};">&#8226;</span>
            <span class="mojangStatusName">${service.name}</span>
        </div>`
        if(service.essential){
            tooltipEssentialHTML += tooltipHTML
        } else {
            tooltipNonEssentialHTML += tooltipHTML
        }

        if(service.status === 'yellow' && status !== 'red'){
            status = 'yellow'
        } else if(service.status === 'red'){
            status = 'red'
        } else {
            if(service.status === 'grey'){
                ++greyCount
            }
            ++greenCount
        }

    }

    if(greenCount === statuses.length){
        if(greyCount === statuses.length){
            status = 'grey'
        } else {
            status = 'green'
        }
    }
    
    document.getElementById('mojangStatusEssentialContainer').innerHTML = tooltipEssentialHTML
    document.getElementById('mojangStatusNonEssentialContainer').innerHTML = tooltipNonEssentialHTML
    document.getElementById('mojang_status_icon').style.color = MojangRestAPI.statusToHex(status)
}

const refreshServerStatus = async (fade = false) => {
    loggerLanding.info('Refreshing Server Status')
    const serv = (await DistroAPI.getDistribution()).getServerById(ConfigManager.getSelectedServer())

    let pLabel = Lang.queryJS('landing.serverStatus.server')
    let pVal = Lang.queryJS('landing.serverStatus.offline')

    try {

        const servStat = await getServerStatus(47, serv.hostname, serv.port)
        console.log(servStat)
        pLabel = Lang.queryJS('landing.serverStatus.players')
        pVal = servStat.players.online + '/' + servStat.players.max

    } catch (err) {
        loggerLanding.warn('Unable to refresh server status, assuming offline.')
        loggerLanding.debug(err)
    }
    if(fade){
        $('#server_status_wrapper').fadeOut(250, () => {
            document.getElementById('landingPlayerLabel').innerHTML = pLabel
            document.getElementById('player_count').innerHTML = pVal
            $('#server_status_wrapper').fadeIn(500)
        })
    } else {
        document.getElementById('landingPlayerLabel').innerHTML = pLabel
        document.getElementById('player_count').innerHTML = pVal
    }
    
}

refreshMojangStatuses()
// Server Status is refreshed in uibinder.js on distributionIndexDone.

// Refresh statuses every hour. The status page itself refreshes every day so...
let mojangStatusListener = setInterval(() => refreshMojangStatuses(true), 60*60*1000)
// Set refresh rate to once every 5 minutes.
let serverStatusListener = setInterval(() => refreshServerStatus(true), 300000)

/**
 * Shows an error overlay, toggles off the launch area.
 * 
 * @param {string} title The overlay title.
 * @param {string} desc The overlay description.
 */
function showLaunchFailure(title, desc){
    setOverlayContent(
        title,
        desc,
        Lang.queryJS('landing.launch.okay')
    )
    setOverlayHandler(null)
    toggleOverlay(true)
    toggleLaunchArea(false)
}

/* System (Java) Scan */

/**
 * Asynchronously scan the system for valid Java installations.
 * 
 * @param {boolean} launchAfter Whether we should begin to launch after scanning. 
 */
async function asyncSystemScan(effectiveJavaOptions, launchAfter = true){

    setLaunchDetails(Lang.queryJS('landing.systemScan.checking'))
    toggleLaunchArea(true)
    setLaunchPercentage(0, 100)

    const jvmDetails = await discoverBestJvmInstallation(
        ConfigManager.getDataDirectory(),
        effectiveJavaOptions.supported
    )

    if(jvmDetails == null) {
        // If the result is null, no valid Java installation was found.
        // Show this information to the user.
        setOverlayContent(
            Lang.queryJS('landing.systemScan.noCompatibleJava'),
            Lang.queryJS('landing.systemScan.installJavaMessage', { 'major': effectiveJavaOptions.suggestedMajor }),
            Lang.queryJS('landing.systemScan.installJava'),
            Lang.queryJS('landing.systemScan.installJavaManually')
        )
        setOverlayHandler(() => {
            setLaunchDetails(Lang.queryJS('landing.systemScan.javaDownloadPrepare'))
            toggleOverlay(false)
            
            try {
                downloadJava(effectiveJavaOptions, launchAfter)
            } catch(err) {
                loggerLanding.error('Unhandled error in Java Download', err)
                showLaunchFailure(Lang.queryJS('landing.systemScan.javaDownloadFailureTitle'), Lang.queryJS('landing.systemScan.javaDownloadFailureText'))
            }
        })
        setDismissHandler(() => {
            $('#overlayContent').fadeOut(250, () => {
                //$('#overlayDismiss').toggle(false)
                setOverlayContent(
                    Lang.queryJS('landing.systemScan.javaRequired', { 'major': effectiveJavaOptions.suggestedMajor }),
                    Lang.queryJS('landing.systemScan.javaRequiredMessage', { 'major': effectiveJavaOptions.suggestedMajor }),
                    Lang.queryJS('landing.systemScan.javaRequiredDismiss'),
                    Lang.queryJS('landing.systemScan.javaRequiredCancel')
                )
                setOverlayHandler(() => {
                    toggleLaunchArea(false)
                    toggleOverlay(false)
                })
                setDismissHandler(() => {
                    toggleOverlay(false, true)

                    asyncSystemScan(effectiveJavaOptions, launchAfter)
                })
                $('#overlayContent').fadeIn(250)
            })
        })
        toggleOverlay(true, true)
    } else {
        // Java installation found, use this to launch the game.
        const javaExec = javaExecFromRoot(jvmDetails.path)
        ConfigManager.setJavaExecutable(ConfigManager.getSelectedServer(), javaExec)
        ConfigManager.save()

        // We need to make sure that the updated value is on the settings UI.
        // Just incase the settings UI is already open.
        settingsJavaExecVal.value = javaExec
        await populateJavaExecDetails(settingsJavaExecVal.value)

        // TODO Callback hell, refactor
        // TODO Move this out, separate concerns.
        if(launchAfter){
            await dlAsync()
        }
    }

}

async function downloadJava(effectiveJavaOptions, launchAfter = true) {

    // TODO Error handling.
    // asset can be null.
    const asset = await latestOpenJDK(
        effectiveJavaOptions.suggestedMajor,
        ConfigManager.getDataDirectory(),
        effectiveJavaOptions.distribution)

    if(asset == null) {
        throw new Error(Lang.queryJS('landing.downloadJava.findJdkFailure'))
    }

    let received = 0
    await downloadFile(asset.url, asset.path, ({ transferred }) => {
        received = transferred
        setDownloadPercentage(Math.trunc((transferred/asset.size)*100))
    })
    setDownloadPercentage(100)

    if(received != asset.size) {
        loggerLanding.warn(`Java Download: Expected ${asset.size} bytes but received ${received}`)
        if(!await validateLocalFile(asset.path, asset.algo, asset.hash)) {
            log.error(`Hashes do not match, ${asset.id} may be corrupted.`)
            // Don't know how this could happen, but report it.
            throw new Error(Lang.queryJS('landing.downloadJava.javaDownloadCorruptedError'))
        }
    }

    // Extract
    // Show installing progress bar.
    remote.getCurrentWindow().setProgressBar(2)

    // Wait for extration to complete.
    const eLStr = Lang.queryJS('landing.downloadJava.extractingJava')
    let dotStr = ''
    setLaunchDetails(eLStr)
    const extractListener = setInterval(() => {
        if(dotStr.length >= 3){
            dotStr = ''
        } else {
            dotStr += '.'
        }
        setLaunchDetails(eLStr + dotStr)
    }, 750)

    const newJavaExec = await extractJdk(asset.path)

    // Extraction complete, remove the loading from the OS progress bar.
    remote.getCurrentWindow().setProgressBar(-1)

    // Extraction completed successfully.
    ConfigManager.setJavaExecutable(ConfigManager.getSelectedServer(), newJavaExec)
    ConfigManager.save()

    clearInterval(extractListener)
    setLaunchDetails(Lang.queryJS('landing.downloadJava.javaInstalled'))

    // TODO Callback hell
    // Refactor the launch functions
    asyncSystemScan(effectiveJavaOptions, launchAfter)

}

// Keep reference to Minecraft Process
let proc
// Is DiscordRPC enabled
let hasRPC = false
// Joined server regex
// Change this if your server uses something different.
const GAME_JOINED_REGEX = /\[.+\]: Sound engine started/
const GAME_LAUNCH_REGEX = /^\[.+\]: (?:MinecraftForge .+ Initialized|ModLauncher .+ starting: .+|Loading Minecraft .+ with Fabric Loader .+)$/
const MIN_LINGER = 5000

async function dlAsync(login = true) {

    // Login parameter is temporary for debug purposes. Allows testing the validation/downloads without
    // launching the game.

    const loggerLaunchSuite = LoggerUtil.getLogger('LaunchSuite')

    setLaunchDetails(Lang.queryJS('landing.dlAsync.loadingServerInfo'))

    let distro

    try {
        distro = await DistroAPI.refreshDistributionOrFallback()
        onDistroRefresh(distro)
    } catch(err) {
        loggerLaunchSuite.error('Unable to refresh distribution index.', err)
        showLaunchFailure(Lang.queryJS('landing.dlAsync.fatalError'), Lang.queryJS('landing.dlAsync.unableToLoadDistributionIndex'))
        return
    }

    const serv = distro.getServerById(ConfigManager.getSelectedServer())

    if(login) {
        if(ConfigManager.getSelectedAccount() == null){
            loggerLanding.error('You must be logged into an account.')
            return
        }
    }

    setLaunchDetails(Lang.queryJS('landing.dlAsync.pleaseWait'))
    toggleLaunchArea(true)
    setLaunchPercentage(0)

    const fullRepairModule = new FullRepair(
        ConfigManager.getCommonDirectory(),
        ConfigManager.getInstanceDirectory(),
        ConfigManager.getLauncherDirectory(),
        ConfigManager.getSelectedServer(),
        DistroAPI.isDevMode()
    )

    fullRepairModule.spawnReceiver()

    fullRepairModule.childProcess.on('error', (err) => {
        loggerLaunchSuite.error('Error during launch', err)
        showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), err.message || Lang.queryJS('landing.dlAsync.errorDuringLaunchText'))
    })
    fullRepairModule.childProcess.on('close', (code, _signal) => {
        if(code !== 0){
            loggerLaunchSuite.error(`Full Repair Module exited with code ${code}, assuming error.`)
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
        }
    })

    loggerLaunchSuite.info('Validating files.')
    setLaunchDetails(Lang.queryJS('landing.dlAsync.validatingFileIntegrity'))
    let invalidFileCount = 0
    try {
        invalidFileCount = await fullRepairModule.verifyFiles(percent => {
            // File verification progress: 0-50% of overall
            setOverallProgress(percent, 0, 50)
        })
        setLaunchPercentage(50)
    } catch (err) {
        loggerLaunchSuite.error('Error during file validation.')
        showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringFileVerificationTitle'), err.displayable || Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
        return
    }
    

    if(invalidFileCount > 0) {
        loggerLaunchSuite.info('Downloading files.')
        setLaunchDetails(Lang.queryJS('landing.dlAsync.downloadingFiles'))
        try {
            await fullRepairModule.download(percent => {
                // Download progress: 50-100% of overall
                setOverallProgress(percent, 50, 100)
            })
            setLaunchPercentage(100)
        } catch(err) {
            loggerLaunchSuite.error('Error during file download.')
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringFileDownloadTitle'), err.displayable || Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
            return
        }
    } else {
        loggerLaunchSuite.info('No invalid files, skipping download.')
        setLaunchPercentage(100)
    }

    // Remove download bar.
    remote.getCurrentWindow().setProgressBar(-1)

    fullRepairModule.destroyReceiver()

    setLaunchDetails(Lang.queryJS('landing.dlAsync.preparingToLaunch'))

    const mojangIndexProcessor = new MojangIndexProcessor(
        ConfigManager.getCommonDirectory(),
        serv.rawServer.minecraftVersion)
    const distributionIndexProcessor = new DistributionIndexProcessor(
        ConfigManager.getCommonDirectory(),
        distro,
        serv.rawServer.id
    )

    const modLoaderData = await distributionIndexProcessor.loadModLoaderVersionJson(serv)
    const versionData = await mojangIndexProcessor.getVersionJson()

    if(login) {
        const authUser = ConfigManager.getSelectedAccount()
        loggerLaunchSuite.info(`Sending selected account (${authUser.displayName}) to ProcessBuilder.`)
        let pb = new ProcessBuilder(serv, versionData, modLoaderData, authUser, remote.app.getVersion())
        setLaunchDetails(Lang.queryJS('landing.dlAsync.launchingGame'))

        // const SERVER_JOINED_REGEX = /\[.+\]: \[CHAT\] [a-zA-Z0-9_]{1,16} joined the game/
        const SERVER_JOINED_REGEX = new RegExp(`\\[.+\\]: \\[CHAT\\] ${authUser.displayName} joined the game`)

        const onLoadComplete = () => {
            toggleLaunchArea(false)
            if(hasRPC){
                DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.loading'))
                proc.stdout.on('data', gameStateChange)
            }
            proc.stdout.removeListener('data', tempListener)
            proc.stderr.removeListener('data', gameErrorListener)
        }
        const start = Date.now()

        // Attach a temporary listener to the client output.
        // Will wait for a certain bit of text meaning that
        // the client application has started, and we can hide
        // the progress bar stuff.
        const tempListener = function(data){
            if(GAME_LAUNCH_REGEX.test(data.trim())){
                const diff = Date.now()-start
                if(diff < MIN_LINGER) {
                    setTimeout(onLoadComplete, MIN_LINGER-diff)
                } else {
                    onLoadComplete()
                }
            }
        }

        // Listener for Discord RPC.
        const gameStateChange = function(data){
            data = data.trim()
            if(SERVER_JOINED_REGEX.test(data)){
                DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.joined'))
            } else if(GAME_JOINED_REGEX.test(data)){
                DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.joining'))
            }
        }

        const gameErrorListener = function(data){
            data = data.trim()
            if(data.indexOf('Could not find or load main class net.minecraft.launchwrapper.Launch') > -1){
                loggerLaunchSuite.error('Game launch failed, LaunchWrapper was not downloaded properly.')
                showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), Lang.queryJS('landing.dlAsync.launchWrapperNotDownloaded'))
            }
        }

        try {
            // Build Minecraft process.
            proc = pb.build()

            // Bind listeners to stdout.
            proc.stdout.on('data', tempListener)
            proc.stderr.on('data', gameErrorListener)

            setLaunchDetails(Lang.queryJS('landing.dlAsync.doneEnjoyServer'))

            // Init Discord Hook
            if(distro.rawDistribution.discord != null && serv.rawServer.discord != null){
                DiscordWrapper.initRPC(distro.rawDistribution.discord, serv.rawServer.discord)
                hasRPC = true
                proc.on('close', (code, signal) => {
                    loggerLaunchSuite.info('Shutting down Discord Rich Presence..')
                    DiscordWrapper.shutdownRPC()
                    hasRPC = false
                    proc = null
                })
            }

        } catch(err) {

            loggerLaunchSuite.error('Error during launch', err)
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), Lang.queryJS('landing.dlAsync.checkConsoleForDetails'))

        }
    }

}

/**
 * News Loading Functions
 */

// DOM Cache
const newsContent                   = document.getElementById('newsContent')
const newsArticleTitle              = document.getElementById('newsArticleTitle')
const newsArticleDate               = document.getElementById('newsArticleDate')
const newsArticleAuthor             = document.getElementById('newsArticleAuthor')
const newsArticleComments           = document.getElementById('newsArticleComments')
const newsNavigationStatus          = document.getElementById('newsNavigationStatus')
const newsArticleContentScrollable  = document.getElementById('newsArticleContentScrollable')
const nELoadSpan                    = document.getElementById('nELoadSpan')

// News slide caches.
let newsActive = false
let newsGlideCount = 0

/**
 * Show the news UI via a slide animation.
 * 
 * @param {boolean} up True to slide up, otherwise false. 
 */
function slide_(up){
    const lCUpper = document.querySelector('#landingContainer > #upper')
    const lCLLeft = document.querySelector('#landingContainer > #lower > #left')
    const lCLCenter = document.querySelector('#landingContainer > #lower > #center')
    const lCLRight = document.querySelector('#landingContainer > #lower > #right')
    const newsBtn = document.querySelector('#landingContainer > #lower > #center #content')
    const landingContainer = document.getElementById('landingContainer')
    const newsContainer = document.querySelector('#landingContainer > #newsContainer')

    newsGlideCount++

    if(up){
        lCUpper.style.top = '-200vh'
        lCLLeft.style.top = '-200vh'
        lCLCenter.style.top = '-200vh'
        lCLRight.style.top = '-200vh'
        newsBtn.style.top = '130vh'
        newsContainer.style.top = '0px'
        //date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'})
        //landingContainer.style.background = 'rgba(29, 29, 29, 0.55)'
        landingContainer.style.background = '#18191c'
        setTimeout(() => {
            if(newsGlideCount === 1){
                lCLCenter.style.transition = 'none'
                newsBtn.style.transition = 'none'
            }
            newsGlideCount--
        }, 2000)
    } else {
        setTimeout(() => {
            newsGlideCount--
        }, 2000)
        landingContainer.style.background = null
        lCLCenter.style.transition = null
        newsBtn.style.transition = null
        newsContainer.style.top = '100%'
        lCUpper.style.top = '0px'
        lCLLeft.style.top = '0px'
        lCLCenter.style.top = '0px'
        lCLRight.style.top = '0px'
        newsBtn.style.top = '10px'
    }
}

// Bind news button.
document.getElementById('newsButton').onclick = () => {
    // Toggle tabbing.
    if(newsActive){
        $('#landingContainer *').removeAttr('tabindex')
        $('#newsContainer *').attr('tabindex', '-1')
    } else {
        $('#landingContainer *').attr('tabindex', '-1')
        $('#newsContainer, #newsContainer *, #lower, #lower #center *').removeAttr('tabindex')
        if(newsAlertShown){
            $('#newsButtonAlert').fadeOut(2000)
            newsAlertShown = false
            ConfigManager.setNewsCacheDismissed(true)
            ConfigManager.save()
        }
    }
    slide_(!newsActive)
    newsActive = !newsActive
}

// Array to store article meta.
let newsArr = null

// News load animation listener.
let newsLoadingListener = null

/**
 * Set the news loading animation.
 * 
 * @param {boolean} val True to set loading animation, otherwise false.
 */
function setNewsLoading(val){
    if(val){
        const nLStr = Lang.queryJS('landing.news.checking')
        let dotStr = '..'
        nELoadSpan.innerHTML = nLStr + dotStr
        newsLoadingListener = setInterval(() => {
            if(dotStr.length >= 3){
                dotStr = ''
            } else {
                dotStr += '.'
            }
            nELoadSpan.innerHTML = nLStr + dotStr
        }, 750)
    } else {
        if(newsLoadingListener != null){
            clearInterval(newsLoadingListener)
            newsLoadingListener = null
        }
    }
}

// Bind retry button.
const _newsErrorRetry = document.getElementById('newsErrorRetry')
if(_newsErrorRetry){
    _newsErrorRetry.onclick = () => {
        $('#newsErrorFailed').fadeOut(250, () => {
            initNews()
            $('#newsErrorLoading').fadeIn(250)
        })
    }
}

if(newsArticleContentScrollable){
    newsArticleContentScrollable.onscroll = (e) => {
        const spacer = $('.newsArticleSpacerTop')
        const spacerH = spacer.length ? Number.parseFloat(spacer.css('height')) : 0
        if(e.target.scrollTop > spacerH){
            newsContent.setAttribute('scrolled', '')
        } else {
            newsContent.removeAttribute('scrolled')
        }
    }
}

/**
 * Reload the news without restarting.
 * 
 * @returns {Promise.<void>} A promise which resolves when the news
 * content has finished loading and transitioning.
 */
function reloadNews(){
    return new Promise((resolve, reject) => {
        $('#newsContent').fadeOut(250, () => {
            $('#newsErrorLoading').fadeIn(250)
            initNews().then(() => {
                resolve()
            })
        })
    })
}

let newsAlertShown = false

/**
 * Show the news alert indicating there is new news.
 */
function showNewsAlert(){
    newsAlertShown = true
    $('#newsButtonAlert').fadeIn(250)
}

async function digestMessage(str) {
    const msgUint8 = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return hashHex
}

/**
 * Initialize News UI. This will load the news and prepare
 * the UI accordingly.
 * 
 * @returns {Promise.<void>} A promise which resolves when the news
 * content has finished loading and transitioning.
 */
async function initNews(){

    setNewsLoading(true)

    const news = await loadNews()

    newsArr = news?.articles || null

    if(newsArr == null){
        // News Loading Failed
        setNewsLoading(false)

        await $('#newsErrorLoading').fadeOut(250).promise()
        await $('#newsErrorFailed').fadeIn(250).promise()

    } else if(newsArr.length === 0) {
        // No News Articles
        setNewsLoading(false)

        ConfigManager.setNewsCache({
            date: null,
            content: null,
            dismissed: false
        })
        ConfigManager.save()

        await $('#newsErrorLoading').fadeOut(250).promise()
        await $('#newsErrorNone').fadeIn(250).promise()
    } else {
        // Success
        setNewsLoading(false)

        const lN = newsArr[0]
        const cached = ConfigManager.getNewsCache()
        let newHash = await digestMessage(lN.content)
        let newDate = new Date(lN.date)
        let isNew = false

        if(cached.date != null && cached.content != null){

            if(new Date(cached.date) >= newDate){

                // Compare Content
                if(cached.content !== newHash){
                    isNew = true
                    showNewsAlert()
                } else {
                    if(!cached.dismissed){
                        isNew = true
                        showNewsAlert()
                    }
                }

            } else {
                isNew = true
                showNewsAlert()
            }

        } else {
            isNew = true
            showNewsAlert()
        }

        if(isNew){
            ConfigManager.setNewsCache({
                date: newDate.getTime(),
                content: newHash,
                dismissed: false
            })
            ConfigManager.save()
        }

        const switchHandler = (forward) => {
            let cArt = parseInt(newsContent.getAttribute('article'))
            let nxtArt = forward ? (cArt >= newsArr.length-1 ? 0 : cArt + 1) : (cArt <= 0 ? newsArr.length-1 : cArt - 1)
    
            displayArticle(newsArr[nxtArt], nxtArt+1)
        }

        document.getElementById('newsNavigateRight').onclick = () => { switchHandler(true) }
        document.getElementById('newsNavigateLeft').onclick = () => { switchHandler(false) }
        await $('#newsErrorContainer').fadeOut(250).promise()
        displayArticle(newsArr[0], 1)
        await $('#newsContent').fadeIn(250).promise()
    }


}

/**
 * Add keyboard controls to the news UI. Left and right arrows toggle
 * between articles. If you are on the landing page, the up arrow will
 * open the news UI.
 */
document.addEventListener('keydown', (e) => {
    if(newsActive){
        if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
            document.getElementById(e.key === 'ArrowRight' ? 'newsNavigateRight' : 'newsNavigateLeft').click()
        }
        // Interferes with scrolling an article using the down arrow.
        // Not sure of a straight forward solution at this point.
        // if(e.key === 'ArrowDown'){
        //     document.getElementById('newsButton').click()
        // }
    } else {
        if(getCurrentView() === VIEWS.landing){
            if(e.key === 'ArrowUp'){
                document.getElementById('newsButton').click()
            }
        }
    }
})

/**
 * Display a news article on the UI.
 * 
 * @param {Object} articleObject The article meta object.
 * @param {number} index The article index.
 */
function displayArticle(articleObject, index){
    newsArticleTitle.innerHTML = articleObject.title
    newsArticleTitle.href = articleObject.link
    newsArticleAuthor.innerHTML = 'by ' + articleObject.author
    newsArticleDate.innerHTML = articleObject.date
    newsArticleComments.innerHTML = articleObject.comments
    newsArticleComments.href = articleObject.commentsLink
    newsArticleContentScrollable.innerHTML = '<div id="newsArticleContentWrapper"><div class="newsArticleSpacerTop"></div>' + articleObject.content + '<div class="newsArticleSpacerBot"></div></div>'
    Array.from(newsArticleContentScrollable.getElementsByClassName('bbCodeSpoilerButton')).forEach(v => {
        v.onclick = () => {
            const text = v.parentElement.getElementsByClassName('bbCodeSpoilerText')[0]
            text.style.display = text.style.display === 'block' ? 'none' : 'block'
        }
    })
    newsNavigationStatus.innerHTML = Lang.query('ejs.landing.newsNavigationStatus', {currentPage: index, totalPages: newsArr.length})
    newsContent.setAttribute('article', index-1)
}

/**
 * Load news information from the RSS feed specified in the
 * distribution index.
 */
async function loadNews(){

    const distroData = await DistroAPI.getDistribution()
    if(!distroData.rawDistribution.rss) {
        loggerLanding.debug('No RSS feed provided.')
        return null
    }

    const promise = new Promise((resolve, reject) => {
        
        const newsFeed = distroData.rawDistribution.rss
        const newsHost = new URL(newsFeed).origin + '/'
        $.ajax({
            url: newsFeed,
            success: (data) => {
                const items = $(data).find('item')
                const articles = []

                for(let i=0; i<items.length; i++){
                // JQuery Element
                    const el = $(items[i])

                    // Resolve date.
                    const date = new Date(el.find('pubDate').text()).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'})

                    // Resolve comments.
                    let comments = el.find('slash\\:comments').text() || '0'
                    comments = comments + ' Comment' + (comments === '1' ? '' : 's')

                    // Fix relative links in content.
                    let content = el.find('content\\:encoded').text()
                    let regex = /src="(?!http:\/\/|https:\/\/)(.+?)"/g
                    let matches
                    while((matches = regex.exec(content))){
                        content = content.replace(`"${matches[1]}"`, `"${newsHost + matches[1]}"`)
                    }

                    let link   = el.find('link').text()
                    let title  = el.find('title').text()
                    let author = el.find('dc\\:creator').text()

                    // Generate article.
                    articles.push(
                        {
                            link,
                            title,
                            date,
                            author,
                            content,
                            comments,
                            commentsLink: link + '#comments'
                        }
                    )
                }
                resolve({
                    articles
                })
            },
            timeout: 2500
        }).catch(err => {
            resolve({
                articles: null
            })
        })
    })

    return await promise
}

// Wire refresh button for landing page (moved from inline script to comply with CSP)
function wireRefreshButtonLanding() {
    const btn = document.getElementById('refreshMediaButtonLanding')
    if(!btn) return
    
    // Remove all existing click listeners by cloning
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)
    
    const hardReload = () => {
        try {
            if (window.location && typeof window.location.reload === 'function') {
                window.location.reload()
                return
            }
        } catch (_) {}
        try { window.location.href = window.location.href } catch (_) {}
    }
    
    newBtn.addEventListener('click', (e) => {
        e.preventDefault()
        hardReload()
    })
}

// Wire refresh button for CGU page
function wireRefreshButtonCGU() {
    const btn = document.getElementById('refreshMediaButton')
    if(!btn) return
    
    // Remove all existing click listeners by cloning
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)
    
    const hardReload = () => {
        try {
            if (window.location && typeof window.location.reload === 'function') {
                window.location.reload()
                return
            }
        } catch (_) {}
        try { window.location.href = window.location.href } catch (_) {}
    }
    
    newBtn.addEventListener('click', (e) => {
        e.preventDefault()
        hardReload()
    })
}

// Wire refresh button for Help page
function wireRefreshButtonHelp() {
    const btn = document.getElementById('refreshMediaButtonHelp')
    if(!btn) return
    
    // Remove all existing click listeners by cloning
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)
    
    const hardReload = () => {
        try {
            if (window.location && typeof window.location.reload === 'function') {
                window.location.reload()
                return
            }
        } catch (_) {}
        try { window.location.href = window.location.href } catch (_) {}
    }
    
    newBtn.addEventListener('click', (e) => {
        e.preventDefault()
        hardReload()
    })
}

// Wire refresh button for Wheel page
function wireRefreshButtonWheel() {
    const btn = document.getElementById('refreshMediaButtonWheel')
    if(!btn) return
    
    // Remove all existing click listeners by cloning
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)
    
    const hardReload = () => {
        try {
            if (window.location && typeof window.location.reload === 'function') {
                window.location.reload()
                return
            }
        } catch (_) {}
        try { window.location.href = window.location.href } catch (_) {}
    }
    
    newBtn.addEventListener('click', (e) => {
        e.preventDefault()
        hardReload()
    })
}

// Wire both buttons on initial load
document.addEventListener('DOMContentLoaded', () => {
    wireRefreshButtonLanding()
    wireRefreshButtonCGU()
    wireRefreshButtonHelp()
    wireRefreshButtonWheel()
})

// Also wire immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    wireRefreshButtonLanding()
    wireRefreshButtonCGU()
    wireRefreshButtonHelp()
    wireRefreshButtonWheel()
}

// Re-wire whenever pages become visible
const observer = new MutationObserver(() => {
    const landingContainer = document.getElementById('landingContainer')
    const cguContainer = document.getElementById('cguContainer')
    const helpContainer = document.getElementById('helpContainer')
    const wheelContainer = document.getElementById('wheelContainer')
    
    if (landingContainer && landingContainer.style.display !== 'none') {
        wireRefreshButtonLanding()
    }
    if (cguContainer && cguContainer.style.display !== 'none') {
        wireRefreshButtonCGU()
    }
    if (helpContainer && helpContainer.style.display !== 'none') {
        wireRefreshButtonHelp()
    }
    if (wheelContainer && wheelContainer.style.display !== 'none') {
        wireRefreshButtonWheel()
    }
})

observer.observe(document.body, { attributes: true, subtree: true })

// Load news articles and populate news cards
async function loadNewsArticles() {
    try {
        loggerLanding.info('Starting to load news articles...')
        
        const distroData = await DistroAPI.getDistribution()
        if(!distroData || !distroData.rawDistribution || !distroData.rawDistribution.rss) {
            loggerLanding.warn('No RSS feed provided in distribution.')
            return
        }

        const newsFeed = distroData.rawDistribution.rss
        loggerLanding.info('RSS Feed URL: ' + newsFeed)
        const newsHost = new URL(newsFeed).origin + '/'
        
        return new Promise((resolve, reject) => {
            $.ajax({
                url: newsFeed,
                dataType: 'xml',
                success: (data) => {
                    loggerLanding.info('RSS data received')
                    const items = $(data).find('item')
                    loggerLanding.info('Found ' + items.length + ' items in RSS')
                    
                    const articles = []

                    for(let i = 0; i < Math.min(items.length, 2); i++){
                        const el = $(items[i])
                        let title = el.find('title').text()
                        let link = el.find('link').text()
                        let content = el.find('content\\:encoded').text()
                        let pubDate = el.find('pubDate').text()
                        
                        loggerLanding.info('Article ' + i + ': ' + title)
                        
                        articles.push({
                            title: title || 'Untitled',
                            link: link || '#',
                            content: content || '',
                            pubDate: pubDate || ''
                        })
                    }

                    // Populate news cards with article titles
                    articles.forEach((article, index) => {
                        const titleEl = document.getElementById('newsTitle' + index)
                        const cardEl = document.getElementById('newsCard' + index)
                        
                        loggerLanding.info('Populating card ' + index + ': titleEl=' + (titleEl ? 'found' : 'not found') + ', cardEl=' + (cardEl ? 'found' : 'not found'))
                        
                        // Store articles in global variable for "See all news" modal
                        allNewsArticles[index] = article
                        
                        // Keep original card title, don't replace it
                        if(cardEl) {
                            cardEl.style.cursor = 'pointer'
                            cardEl.onclick = (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                loggerLanding.info('Opening article in modal: ' + article.title)
                                
                                // Display news in modal instead of opening new window
                                displayNewsArticle(article, index, 'news')
                            }
                            loggerLanding.info('Set click handler for card ' + index)
                        }
                    })

                    loggerLanding.info('News articles loaded successfully: ' + articles.length)
                    resolve(articles)
                },
                error: (err) => {
                    loggerLanding.error('AJAX error loading RSS: ' + err.status + ' ' + err.statusText, err)
                    reject(err)
                },
                timeout: 5000
            })
        })
    } catch(err) {
        loggerLanding.error('Error loading news articles: ' + err.message, err)
    }
}

// Load news from custom RSS URL (for additional news sources)
function loadNewsFromURL(rssUrl, cardPrefix) {
    try {
        loggerLanding.info('Loading news from custom URL: ' + rssUrl)
        
        $.ajax({
            url: rssUrl,
            dataType: 'xml',
            success: (data) => {
                loggerLanding.info('RSS data received from ' + rssUrl)
                const items = $(data).find('item')
                loggerLanding.info('Found ' + items.length + ' items in RSS from ' + cardPrefix)
                
                const articles = []

                for(let i = 0; i < Math.min(items.length, 2); i++){
                    const el = $(items[i])
                    let title = el.find('title').text()
                    let link = el.find('link').text()
                    let content = el.find('content\\:encoded').text()
                    let pubDate = el.find('pubDate').text()
                    
                    loggerLanding.info('Article from ' + cardPrefix + ' ' + i + ': ' + title)
                    
                    articles.push({
                        title: title || 'Untitled',
                        link: link || '#',
                        content: content || '',
                        pubDate: pubDate || ''
                    })
                }

                // Populate news cards with article titles
                articles.forEach((article, index) => {
                    const titleEl = document.getElementById(cardPrefix + 'Title' + index)
                    const cardEl = document.getElementById(cardPrefix + 'Card' + index)
                    
                    loggerLanding.info('Populating ' + cardPrefix + ' card ' + index + ': titleEl=' + (titleEl ? 'found' : 'not found') + ', cardEl=' + (cardEl ? 'found' : 'not found'))
                    
                    // Store articles in global variable for "See all news" modal (offset by 1 for event articles)
                    if(cardPrefix === 'event') {
                        allNewsArticles[1] = article
                    }
                    
                    // Keep original card title, don't replace it
                    if(cardEl) {
                        cardEl.style.cursor = 'pointer'
                        cardEl.onclick = (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            loggerLanding.info('Opening ' + cardPrefix + ' article in modal: ' + article.title)
                            
                            // Display news in modal
                            displayNewsArticle(article, index, cardPrefix)
                        }
                        loggerLanding.info('Set click handler for ' + cardPrefix + ' card ' + index)
                    }
                })

                loggerLanding.info('Custom news articles loaded successfully from ' + cardPrefix + ': ' + articles.length)
            },
            error: (err) => {
                loggerLanding.error('AJAX error loading RSS from ' + rssUrl + ': ' + err.status + ' ' + err.statusText, err)
            },
            timeout: 5000
        })
    } catch(err) {
        loggerLanding.error('Error loading news from URL: ' + err.message, err)
    }
}

// Function to display news article in modal overlay
function displayNewsArticle(article, index, cardPrefix = 'news') {
    try {
        loggerLanding.info('Displaying article ' + index + ' in modal')
        
        // Get modal elements
        const newsModalOverlay = document.getElementById('newsModalOverlay')
        const newsModalTitle = document.getElementById('newsModalTitle')
        const newsModalContent = document.getElementById('newsModalContent')
        
        if(!newsModalOverlay || !newsModalTitle || !newsModalContent) {
            loggerLanding.error('Modal elements not found: overlay=' + (newsModalOverlay ? 'yes' : 'no') + ', title=' + (newsModalTitle ? 'yes' : 'no') + ', content=' + (newsModalContent ? 'yes' : 'no'))
            return
        }
        
        // Populate modal with article data
        // Use card title if available, otherwise article title
        let cardTitle = null
        const titleEl = document.getElementById(cardPrefix + 'Title' + index)
        if(titleEl) {
            cardTitle = titleEl.textContent
        }
        newsModalTitle.textContent = cardTitle || article.title || 'Untitled Article'
        
        // Set article content (with fallback if HTML content not available)
        let contentHTML = article.content
        if(!contentHTML) {
            contentHTML = '<p>No content available for this article.</p>'
        }
        newsModalContent.innerHTML = contentHTML
        
        // Show modal with fade-in animation
        newsModalOverlay.classList.add('show')
        
        loggerLanding.info('Article ' + index + ' displayed in modal: ' + article.title)
    } catch(err) {
        loggerLanding.error('Error displaying article: ' + err.message, err)
    }
}

// Function to close news modal
function closeNewsModal() {
    try {
        const newsModalOverlay = document.getElementById('newsModalOverlay')
        if(newsModalOverlay) {
            newsModalOverlay.classList.remove('show')
            loggerLanding.info('News modal closed')
        }
    } catch(err) {
        loggerLanding.error('Error closing modal: ' + err.message, err)
    }
}

// Load news on page init - give it time to ensure DOM is ready
setTimeout(() => {
    loggerLanding.info('Executing delayed news load...')
    loadNewsArticles().catch(err => {
        loggerLanding.warn('News load failed: ' + err)
    })
    
    // Load news from custom RSS URL for the second card
    loadNewsFromURL('https://vanylaplus.fr/news.xml', 'event')
    
    // Setup news modal close handlers
    const newsModalOverlay = document.getElementById('newsModalOverlay')
    const newsModalCloseBtn = document.getElementById('newsModalCloseBtn')
    
    if(newsModalOverlay) {
        // Close modal when clicking close button
        if(newsModalCloseBtn) {
            newsModalCloseBtn.addEventListener('click', closeNewsModal)
        }
        
        // Close modal when clicking on the overlay background (outside the box)
        newsModalOverlay.addEventListener('click', (e) => {
            if(e.target === newsModalOverlay) {
                closeNewsModal()
            }
        })
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape' && newsModalOverlay.classList.contains('show')) {
                closeNewsModal()
            }
        })
    }
    
    // Setup all news modal close handlers
    const allNewsModalOverlay = document.getElementById('allNewsModalOverlay')
    const allNewsModalCloseBtn = document.getElementById('allNewsModalCloseBtn')
    
    if(allNewsModalOverlay) {
        // Close modal when clicking close button
        if(allNewsModalCloseBtn) {
            allNewsModalCloseBtn.addEventListener('click', closeAllNewsModal)
        }
        
        // Close modal when clicking on the overlay background
        allNewsModalOverlay.addEventListener('click', (e) => {
            if(e.target === allNewsModalOverlay) {
                closeAllNewsModal()
            }
        })
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape' && allNewsModalOverlay.style.opacity !== '0') {
                closeAllNewsModal()
            }
        })
    }
}, 1000)

// Store all loaded articles for the "See all news" modal
let allNewsArticles = []

// Function to open the "See all news" modal with all loaded news
function openAllNewsModal() {
    try {
        console.log('openAllNewsModal called')
        loggerLanding.info('Opening all news modal')
        
        const allNewsModalOverlay = document.getElementById('allNewsModalOverlay')
        const allNewsModalContent = document.getElementById('allNewsModalContent')
        
        console.log('Modal overlay:', allNewsModalOverlay)
        console.log('Modal content:', allNewsModalContent)
        
        if(!allNewsModalOverlay || !allNewsModalContent) {
            loggerLanding.error('All news modal elements not found')
            console.error('Modal elements not found!')
            return
        }
        
        // Create news cards HTML
        let cardsHTML = ''
        
        // Get news cards from DOM
        const newsCard0 = document.getElementById('newsCard0')
        const eventCard0 = document.getElementById('eventCard0')
        
        console.log('newsCard0:', newsCard0)
        console.log('eventCard0:', eventCard0)
        
        if(newsCard0) {
            const newsTitle0 = document.getElementById('newsTitle0')
            const newsCardBg = newsCard0.querySelector('.news-card-background')
            const bgStyle = newsCardBg ? newsCardBg.style.background : 'url(https://vanylaplus.fr/images/news1.png) center/cover no-repeat'
            console.log('newsTitle0:', newsTitle0)
            console.log('bgStyle:', bgStyle)
            cardsHTML += `
                <div class="news-card" style="cursor:pointer; height: 280px !important; background: ${bgStyle}; position:relative;" onclick="displayNewsArticle(allNewsArticles[0], 0, 'news'); closeAllNewsModal();">
                    <div class="news-card-overlay"></div>
                    <div class="news-card-content">
                        <h3 class="news-card-title">${newsTitle0 ? newsTitle0.textContent : 'News'}</h3>
                    </div>
                </div>
            `
        }
        
        if(eventCard0) {
            const eventTitle0 = document.getElementById('eventTitle0')
            const eventCardBg = eventCard0.querySelector('.news-card-background')
            const bgStyle = eventCardBg ? eventCardBg.style.background : 'url(https://vanylaplus.fr/images/newsbase.png) center/cover no-repeat'
            cardsHTML += `
                <div class="news-card" style="cursor:pointer; height: 280px !important; background: ${bgStyle}; position:relative;" onclick="displayNewsArticle(allNewsArticles[1], 0, 'event'); closeAllNewsModal();">
                    <div class="news-card-overlay"></div>
                    <div class="news-card-content">
                        <h3 class="news-card-title">${eventTitle0 ? eventTitle0.textContent : 'Event'}</h3>
                    </div>
                </div>
            `
        }
        
        console.log('cardsHTML:', cardsHTML)
        allNewsModalContent.innerHTML = cardsHTML
        allNewsModalOverlay.style.opacity = '1'
        allNewsModalOverlay.style.pointerEvents = 'auto'
        
        loggerLanding.info('All news modal opened with cards HTML')
    } catch(err) {
        loggerLanding.error('Error opening all news modal: ' + err.message, err)
        console.error('Error opening all news modal:', err)
    }
}

// Function to close the all news modal
function closeAllNewsModal() {
    try {
        const allNewsModalOverlay = document.getElementById('allNewsModalOverlay')
        if(allNewsModalOverlay) {
            allNewsModalOverlay.style.opacity = '0'
            allNewsModalOverlay.style.pointerEvents = 'none'
            loggerLanding.info('All news modal closed')
        }
    } catch(err) {
        loggerLanding.error('Error closing all news modal: ' + err.message, err)
    }
}
