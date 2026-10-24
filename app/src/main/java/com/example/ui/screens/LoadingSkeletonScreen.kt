package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.ui.components.rememberShimmerBrush

@Composable
fun LoadingSkeletonScreen() {
    val shimmerBrush = rememberShimmerBrush()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        Spacer(modifier = Modifier.height(60.dp))
        
        // Logo Shimmer
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(shimmerBrush)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Title Shimmer
        Box(
            modifier = Modifier
                .width(240.dp)
                .height(24.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(shimmerBrush)
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Subtitle Shimmer
        Box(
            modifier = Modifier
                .width(180.dp)
                .height(16.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(shimmerBrush)
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        // Card Shimmer 1
        SkeletonCard(shimmerBrush)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Card Shimmer 2
        SkeletonCard(shimmerBrush)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Card Shimmer 3
        SkeletonCard(shimmerBrush)
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Bottom Button Shimmer
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(shimmerBrush)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SkeletonCard(brush: androidx.compose.ui.graphics.Brush) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(brush)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(18.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(brush)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(14.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(brush)
                )
            }
        }
    }
}
