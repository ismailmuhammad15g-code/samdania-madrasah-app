package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Alignment
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.AppScreen
import com.example.ui.MainViewModel
import com.example.ui.components.MadrasahBottomNavigationBar
import com.example.ui.screens.*
import com.example.ui.theme.SamdaniaMadrasahTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Request Notification & Camera Permission
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(
                arrayOf(
                    android.Manifest.permission.POST_NOTIFICATIONS,
                    android.Manifest.permission.CAMERA,
                    android.Manifest.permission.RECORD_AUDIO
                ), 101
            )
        } else {
            // Request Camera & Audio for older versions
            requestPermissions(
                arrayOf(
                    android.Manifest.permission.CAMERA,
                    android.Manifest.permission.RECORD_AUDIO
                ), 101
            )
        }

        com.example.data.worker.NoticeWorker.startPeriodicPolling(this)
        setContent {
            SamdaniaMadrasahTheme {
                MadrasahApp()
            }
        }
    }
}

@Composable
fun MadrasahApp(viewModel: MainViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val showBottomNav = uiState.currentScreen in listOf(
        AppScreen.STUDENT_DASHBOARD,
        AppScreen.DIGITAL_ID,
        AppScreen.NOTIFICATIONS,
        AppScreen.FEES_PAYMENT,
        AppScreen.PROFILE
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.safeDrawing,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (showBottomNav && !uiState.isLoading) {
                MadrasahBottomNavigationBar(
                    selectedTab = uiState.currentNavTab,
                    onTabSelected = { viewModel.onNavTabSelected(it) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(if (showBottomNav && !uiState.isLoading) innerPadding else PaddingValues(0.dp))
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                if (uiState.isOffline) {
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.CloudOff,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "আপনার ইন্টারনেট কানেকশন নেই (No Internet)",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }

                if (uiState.isLoading) {
                    LoadingSkeletonScreen()
                } else {
                AnimatedContent(
                    targetState = uiState.currentScreen,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label = "screen_transition"
                ) { screen ->
                    when (screen) {
                        AppScreen.LOGIN -> LoginScreen(
                            onLoginStudent = { query, classFilter, onSuccess, onError ->
                                viewModel.loginStudent(
                                    query = query,
                                    classFilter = classFilter,
                                    onSuccess = onSuccess,
                                    onError = onError
                                )
                            },
                            onSelectStudent = { student ->
                                viewModel.selectStudent(student) {
                                    scope.launch {
                                        snackbarHostState.showSnackbar("${student.name} হিসেবে লগইন সম্পন্ন হয়েছে")
                                    }
                                }
                            },
                            onEnterTeacherPortal = {
                                viewModel.enterTeacherPortal(onSuccess = {})
                            },
                            onLoginAdmin = { email, pass, onSuccess, onError ->
                                viewModel.loginAdmin(email, pass, onSuccess, onError)
                            },
                            onRefreshServer = {
                                viewModel.loadInitialData()
                                scope.launch {
                                    snackbarHostState.showSnackbar("মাদ্রাসা সার্ভার ডেটা রিফ্রেশ করা হচ্ছে...")
                                }
                            },
                            allStudents = uiState.allStudents,
                            allTeachers = uiState.allTeachers,
                            connectionStatus = uiState.connectionStatus,
                            onSuccess = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("লগইন সফল হয়েছে!")
                                }
                            }
                        )

                        AppScreen.STUDENT_DASHBOARD -> StudentDashboardScreen(
                            uiState = uiState,
                            onNavigate = { viewModel.navigateTo(it) }
                        )

                        AppScreen.ATTENDANCE -> AttendanceScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) },
                            onRefresh = { viewModel.loadInitialData() }
                        )

                        AppScreen.ROUTINE -> RoutineScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.ACADEMIC -> AcademicScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.FEES_PAYMENT -> FeesPaymentScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.RESULT -> ResultScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.HOMEWORK -> HomeworkScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.QUIZ_CONTEST -> QuizScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.DIGITAL_ID -> DigitalIdCardScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.NOTIFICATIONS -> NotificationsScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) }
                        )

                        AppScreen.PROFILE -> ProfileScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) },
                            onNavigate = { viewModel.navigateTo(it) },
                            onLogout = { viewModel.logout() }
                        )

                        AppScreen.TEACHER_PORTAL -> TeacherPortalScreen(
                            uiState = uiState,
                            onBack = { 
                                // If they are a teacher, back shouldn't just go to dashboard
                                // Handled internally by WebView or explicitly by logout
                            },
                            onLogout = { viewModel.logout() },
                            onMarkAttendance = { studentId, status ->
                                viewModel.teacherMarkAttendance(studentId, status)
                            },
                            onPostHomework = { subject, title, desc, due ->
                                viewModel.teacherPostHomework(subject, title, desc, due)
                            },
                            onNavigate = { viewModel.navigateTo(it) }
                        )

                        AppScreen.ADMIN_PORTAL -> AdminPortalScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.STUDENT_DASHBOARD) },
                            onNavigate = { viewModel.navigateTo(it) },
                            onPublishNotice = { title, content, isBreaking, cat ->
                                viewModel.adminPublishNotice(title, content, isBreaking, cat)
                            },
                            onAddStudent = { roll, name, bn, cl, sec, ph, gu, photo, cb ->
                                viewModel.adminAddStudent(roll, name, bn, cl, sec, ph, gu, photo, cb)
                            },
                            onInitializeDatabase = { cb ->
                                viewModel.initializeStarterDatabase(cb)
                            }
                        )

                        AppScreen.ADMIN_SUPABASE_GUIDE -> AdminSupabaseGuideScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.ADMIN_PORTAL) },
                            onSaveConfig = { url, key, onDone ->
                                viewModel.updateSupabaseConfig(url, key, onDone)
                            },
                            onTestPing = { onResult ->
                                viewModel.testSupabaseConnection(onResult)
                            },
                            getSqlScript = { viewModel.getSqlMigrationScript() }
                        )

                        AppScreen.MISSING_FILLOUTS -> MissingFilloutsScreen(
                            missingStudents = uiState.missingFillouts,
                            isUploading = uiState.isUploadingImage,
                            onUploadImage = { studentId, part, onDone ->
                                viewModel.uploadStudentImage(studentId, part, onDone)
                            },
                            onBack = { viewModel.navigateTo(AppScreen.ADMIN_PORTAL) }
                        )

                        AppScreen.APP_MANAGEMENT -> AppManagementScreen(
                            uiState = uiState,
                            onBack = { viewModel.navigateTo(AppScreen.ADMIN_PORTAL) },
                            onPublishNotice = { t, c, b, cat ->
                                viewModel.adminPublishNotice(t, c, b, cat)
                            },
                            onDeleteNotice = { id ->
                                viewModel.adminDeleteNotice(id)
                            },
                            onNavigateToMissingFillouts = {
                                viewModel.navigateTo(AppScreen.MISSING_FILLOUTS)
                            }
                        )
                    }
                }
            }
        }
    }
}
}
