package com.example.ui.screens

import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.AppScreen
import com.example.ui.MainUiState
import com.example.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherPortalScreen(
    uiState: MainUiState,
    onBack: () -> Unit,
    onLogout: () -> Unit,
    onMarkAttendance: (String, String) -> Unit,
    onPostHomework: (String, String, String, String) -> Unit,
    onNavigate: (AppScreen) -> Unit,
    modifier: Modifier = Modifier
) {
    var canGoBack by remember { mutableStateOf(false) }
    var webView: WebView? by remember { mutableStateOf(null) }

    var isRefreshing by remember { mutableStateOf(false) }
    var loadingProgress by remember { mutableFloatStateOf(0f) }
    var hasError by remember { mutableStateOf(false) }
    var retryCount by remember { mutableIntStateOf(0) }
    var isSlowConnection by remember { mutableStateOf(false) }

    // Detect slow connection if progress is stuck
    LaunchedEffect(loadingProgress, isRefreshing) {
        if (loadingProgress in 0.01f..0.8f || isRefreshing) {
            delay(12000) // 12 seconds
            if (loadingProgress < 0.8f) {
                isSlowConnection = true
            }
        } else {
            isSlowConnection = false
        }
    }

    // Auto-retry on error every 5 seconds
    LaunchedEffect(hasError, retryCount) {
        if (hasError) {
            delay(5000)
            hasError = false
            webView?.reload()
        }
    }

    BackHandler {
        if (canGoBack) {
            webView?.goBack()
        } else {
            onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("শিক্ষক পোর্টাল (Teacher Panel)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("External Management Dashboard", fontSize = 11.sp, color = Color.White.copy(alpha = 0.8f))
                    }
                },
                actions = {
                    IconButton(onClick = {
                        hasError = false
                        isRefreshing = true
                        webView?.reload()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "রিফ্রেশ", tint = Color.White)
                    }
                    IconButton(onClick = onLogout, modifier = Modifier.testTag("teacher_logout_button")) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "লগআউট", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MadrasahNavy,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Browser-style Progress Bar
                if (loadingProgress > 0f && loadingProgress < 1f) {
                    LinearProgressIndicator(
                        progress = { loadingProgress },
                        modifier = Modifier.fillMaxWidth().height(3.dp),
                        color = MadrasahGold,
                        trackColor = Color.Transparent
                    )
                }

                if (isSlowConnection && !hasError) {
                    Surface(
                        color = Color(0xFFFFF7ED),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = Color(0xFF9A3412),
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "আপনার ইন্টারনেট কানেকশন কিছুটা ধীর (Slow Connection)",
                                fontSize = 11.sp,
                                color = Color(0xFF9A3412),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                PullToRefreshBox(
                    isRefreshing = isRefreshing,
                    onRefresh = {
                        hasError = false
                        isRefreshing = true
                        webView?.reload()
                    },
                    modifier = Modifier.fillMaxSize()
                ) {
                    AndroidView(
                        factory = { context ->
                            WebView(context).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                
                                // Enable Session/Cookie Persistence
                                val cookieManager = CookieManager.getInstance()
                                cookieManager.setAcceptCookie(true)
                                cookieManager.setAcceptThirdPartyCookies(this, true)
                                
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                settings.databaseEnabled = true
                                settings.loadWithOverviewMode = true
                                settings.useWideViewPort = true
                                settings.setSupportZoom(true)
                                settings.mediaPlaybackRequiresUserGesture = false
                                settings.allowFileAccess = true
                                settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
                                settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                
                                // Enable Nested Scrolling for Pull-to-Refresh Support
                                isNestedScrollingEnabled = true
                                
                                webViewClient = object : WebViewClient() {
                                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                                        super.onPageStarted(view, url, favicon)
                                        hasError = false
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        canGoBack = view?.canGoBack() == true
                                        isRefreshing = false
                                        // If finished and progress was 100, assume success unless onReceivedError was called
                                    }

                                    override fun onReceivedError(
                                        view: WebView?,
                                        request: android.webkit.WebResourceRequest?,
                                        error: android.webkit.WebResourceError?
                                    ) {
                                        if (request?.isForMainFrame == true) {
                                            hasError = true
                                            isRefreshing = false
                                        }
                                    }

                                    override fun onReceivedHttpError(
                                        view: WebView?,
                                        request: android.webkit.WebResourceRequest?,
                                        errorResponse: android.webkit.WebResourceResponse?
                                    ) {
                                        // Some sites might return 404 or 500
                                        if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 400) {
                                            hasError = true
                                            isRefreshing = false
                                        }
                                    }

                                    override fun onReceivedSslError(
                                        view: WebView?,
                                        handler: android.webkit.SslErrorHandler?,
                                        error: android.net.http.SslError?
                                    ) {
                                        // In production, you should handle this carefully
                                        // For now, let's retry or show error
                                        hasError = true
                                        isRefreshing = false
                                        handler?.cancel()
                                    }
                                }
                                
                                webChromeClient = object : WebChromeClient() {
                                    override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                        loadingProgress = newProgress / 100f
                                        if (newProgress == 100) {
                                            isRefreshing = false
                                        }
                                    }

                                    override fun onPermissionRequest(request: android.webkit.PermissionRequest?) {
                                        request?.grant(request.resources)
                                    }
                                }
                                
                                loadUrl("https://samdaniamadrasah.vercel.app/")
                                webView = this
                            }
                        },
                        modifier = Modifier.fillMaxSize(),
                        update = { view ->
                            // Ensure sync with Compose state if needed
                        }
                    )
                }
            }

            // Error UI Overlay
            if (hasError) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.White
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "ওয়েব পেজটি লোড করা যাচ্ছে না",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = MadrasahNavy
                        )
                        Text(
                            "দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন। ৫ সেকেন্ড পর অটো-রিট্রাই করা হবে।",
                            fontSize = 13.sp,
                            color = Color.Gray,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                hasError = false
                                isRefreshing = true
                                retryCount++
                                webView?.reload()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MadrasahNavy)
                        ) {
                            Text("পুনরায় চেষ্টা করুন (Retry Now)")
                        }
                    }
                }
            }
        }
    }
}
